/* ────────────────────────────────────────────────────────────────────
   backend/services/autoApplySmartRecruiters.js
   SmartRecruiters “one-click” auto-apply helper
   ────────────────────────────────────────────────────────────────── */
try { require('@img/sharp-libvips-darwin-arm64'); } catch {}
require('dotenv').config();

const { ChatOpenAI } = require('@langchain/openai');
const { HyperAgent }  = require('@hyperbrowser/agent');
const path = require('path');
const fs   = require('fs');

/* ── tiny utils ─────────────────────────────────────────────────── */
const rnd   = (a, b)  => Math.floor(Math.random() * (b - a + 1)) + a;
const delay = (p,a,b) => p.waitForTimeout(rnd(a, b));


const srMaps = {
  veteran(v){
    switch((v||'').toLowerCase()){
      case 'protected_veteran': return 'Yes';
      case 'not_veteran':       return 'No';
      default:                  return 'Prefer not to answer';
    }
  },
  disability(v){
    switch((v||'').toLowerCase()){
      case 'yes_disability': return 'Yes, I have a disability, or have had one in the past.';
      case 'no_disability':  return 'No, I do not have a disability and have not had one in the past.';
      default:               return 'I do not want to answer.';
    }
  },
  gender(v){
    const g=(v||'').toLowerCase();
    if(g==='male')       return 'Male';
    if(g==='female')     return 'Female';
    if(g==='nonbinary')  return 'Non-binary/ third gender';
    return 'Prefer not to answer';
  },
  race(v){
    const r=(v||'').toLowerCase();
    if(r==='asian') return 'Asian';
    /* add more as desired */
    return 'Prefer not to answer';
  }
};

/* reach into a host’s shadow DOM and return the native input / textarea */
async function native(frame,host){
  if(!host) return null;
  for(let i=0;i<10;i++){
    const h=await host.evaluateHandle(el=>(el.shadowRoot||el).querySelector('input,textarea'));
    const el=h.asElement();
    if(el && await el.isVisible()) return el;
    await delay(frame,300,300);
  }
  return null;
}

/* full “deep click” helper … (unchanged) */
async function clickDeep(frame,sel){
  const oc  = await frame.$(sel);
  const spl = oc  && await oc.evaluateHandle(el=>el.shadowRoot?.querySelector('spl-button')).then(h=>h.asElement());
  const btn = spl && await spl.evaluateHandle(el=>el.shadowRoot?.querySelector('button')).then(h=>h.asElement());
  const tap = async el=>{
    await el.scrollIntoViewIfNeeded();
    await el.dispatchEvent('pointerdown');
    await el.dispatchEvent('pointerup');
    await el.dispatchEvent('click',{bubbles:true});
  };
  if(btn){await tap(btn);return true;}
  if(spl){await tap(spl);return true;}
  if(oc ){await tap(oc); return true;}
  return false;
}




/* ── tick “I currently work here / attend” ── */
async function tickCheckbox(frame, hostSelector) {
  const host = await frame.$(hostSelector);
  if (!host) return false;

  const real = await native(frame, host);   // <input type="checkbox">
  if (!real) return false;

  const isChecked = await real.isChecked(); // Playwright helper
  if (isChecked) return true;

  // 1️⃣  toggle the DOM property so Lit/Angular observe the change
  await real.evaluate(el => { el.checked = true });

  // 2️⃣  mirror attribute for any attribute-bindings
  await real.evaluate(el => el.setAttribute('aria-checked', 'true'));

  // 3️⃣  fire the same events the component attaches to
  await real.dispatchEvent('input');        // bubbles by default
  await real.dispatchEvent('change', { bubbles: true });

  return true;
}



/* generic helper for spl-autocomplete */
async function fillAutoComplete(frame, host, value){
  if(!value || !host) return false;
  const input = await host.evaluateHandle(el=>{
    const dive = n =>
      n?.shadowRoot?.querySelector('spl-input')?.shadowRoot?.querySelector('input') ||
      n?.shadowRoot?.querySelector('input') ||
      n?.querySelector('input');
    return dive(el);
  }).then(h=>h.asElement());
  if(!input) return false;

  await input.fill(value);
  await delay(frame,1200,1500);
  await frame.keyboard.press('ArrowDown');
  await frame.keyboard.press('Enter');
  return true;
}



/* ── improved flat-pickr “month-year” helper (no more crash) ─────── */
async function fillDate(frame, dateFieldHost, month, year) {
  if (!(month || year) || !dateFieldHost) return false;

  /* 1⃣ dive two shadow layers to reach <input.flatpickr-input> */
  const input = await dateFieldHost.evaluateHandle(el => {
    const picker = el.shadowRoot?.querySelector('spl-date-picker');
    return picker?.shadowRoot?.querySelector('input.flatpickr-input[data-input]');
  }).then(h => h.asElement());
  if (!input) {
    console.log('[DEBUG] fillDate › NO inner input found');
    return false;
  }

  /* 2⃣ compose e.g. “Jan 2024” */
  const m   = month || 'Jan';
  const y   = year  || new Date().getFullYear();
  const text = `${m} ${y}`;

  /* 3⃣ type → flatpickr parses & closes on Enter */
  await input.click({ clickCount: 3 });
  await input.type(text, { delay: 40 });
  await input.press('Enter');
  await delay(frame, 300, 450);

  /* 4⃣ bubble events so Angular form control updates */
  await frame.evaluate(el => {
    ['input', 'change', 'blur'].forEach(ev =>
      el.dispatchEvent(new Event(ev, { bubbles: true, composed: true })));
  }, input);

  /* 5⃣ debug: show stored value (safe – won’t crash) */
  try {
    console.log('[DEBUG] fillDate › value after type:', await input.inputValue());
  } catch { /* ignore */ }

  return true;
}




function dateInFuture(month, year){
  if(!year) return false;
  const cmp   = new Date(`${month||'Jan'} 1, ${year}`);
  return cmp > new Date();
}

/* ────────────────── EXPERIENCE pop-up ──────────────────────────── */
async function addExperiences(frame, page, exps=[]){
  if(!exps.length) return;
  console.log(`[INFO] Adding ${exps.length} experience entr${exps.length===1?'y':'ies'}`);

  for(const exp of exps){
    await clickDeep(frame,'oc-button[data-test="add-experience"]');
    await frame.waitForSelector('oc-experience-edit-form',{timeout:15_000});
    const form = await frame.$('oc-experience-edit-form');
    await delay(frame,800,1000);

    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[data-test="job-title-autocomplete"]'),
      exp.job_title);
    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[data-test="company-autocomplete"]'),
      exp.company_name);
    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[data-test="location-autocomplete"]'),
      exp.company_location);

    if(exp.job_description){
      const descHost = await form.$('spl-textarea[id^="exp-desc"]');
      const desc     = await native(frame,descHost);
      if(desc) await desc.fill(exp.job_description);
    }

    /* ── dates ───────────────────────────────────────────── */
    const fromHost = await form.$('spl-date-field[label="From"]');
    const toHost   = await form.$('spl-date-field[label="To"]');
    console.log('[DEBUG] From host?',!!fromHost,'To host?',!!toHost);

    await fillDate(frame, fromHost, exp.start_month, exp.start_year);
    await fillDate(frame,   toHost, exp.end_month,   exp.end_year);

    const markCurrentJob = exp.current_job || !(exp.end_month || exp.end_year);
    if (markCurrentJob) {
      await tickCheckbox(frame,
        'oc-checkbox[data-test="experience-current"] spl-checkbox');
    }




    await clickDeep(form,'oc-button[data-test="experience-save"]');
    await delay(frame,1600,2000);
  }
}

/* ─────────────────── EDUCATION pop-up ─────────────────────────── */
async function addEducations(frame, page, edus=[]){
  if(!edus.length) return;
  console.log(`[INFO] Adding ${edus.length} education entr${edus.length===1?'y':'ies'}`);

  for(const edu of edus){
    await clickDeep(frame,'oc-button[data-test="add-education"]');
    await frame.waitForSelector('oc-education-edit-form',{timeout:15_000});
    const form = await frame.$('oc-education-edit-form');
    await delay(frame,800,1000);

    await fillAutoComplete(frame,
      await form.$('spl-input[label="Institution"]'),
      edu.school_name);

    const degreeInput = await native(frame,
      await form.$('spl-input[label="Degree"]'));
    if(degreeInput) await degreeInput.fill(edu.degree_level||'');

    const majorInput = await native(frame,
      await form.$('spl-input[label="Major"]'));
    if(majorInput) await majorInput.fill(edu.major||'');

    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[data-test="location-autocomplete"]'),
      edu.school_location);

    /* ── dates ───────────────────────────────────────────── */
    const fromHost = await form.$('spl-date-field[label="From"]');
    const toHost   = await form.$('spl-date-field[label="To"]');
    console.log('[DEBUG] EDU From?',!!fromHost,'To?',!!toHost);

    await fillDate(frame, fromHost, edu.start_month, edu.start_year);
    await fillDate(frame,   toHost, edu.end_month,   edu.end_year);

    

    const markCurrentEdu = !(edu.end_month || edu.end_year) ||
                       dateInFuture(edu.end_month, edu.end_year);
    if (markCurrentEdu) {
      await tickCheckbox(frame,
        'oc-checkbox[data-test="education-current"] spl-checkbox');
    }


    await clickDeep(form,'oc-button[data-test="education-save"]');
    await delay(frame,1600,2000);
  }
}

/* ────────────────── FIRST PAGE handler ──────────────────────────── */
async function handleFirstPage(frame, page, u){
  /* resume upload -------------------------------------------------- */
  const pdf = path.resolve(__dirname,'resume.pdf');
  if(fs.existsSync(pdf)){
    console.log('[INFO] Uploading resume…');
    const dz = await frame.$('spl-dropzone[data-test="resume-upload"]');
    if(dz){
      const hidden = await dz.evaluateHandle(el=>{
        const dfs=n=>{
          if(!n) return null;
          if(n.matches?.('input[type="file"]')) return n;
          const kids=[...(n.children||[]),...(n.shadowRoot?Array.from(n.shadowRoot.children):[])];
          for(const k of kids){const r=dfs(k);if(r) return r;}
          return null;
        };
        return dfs(el);
      }).then(h=>h.asElement());
      if(hidden){
        await hidden.setInputFiles(pdf);
        await hidden.dispatchEvent('change');
        await hidden.dispatchEvent('input');
        await delay(frame,2200,2600);
      }
    }
  }

  /* basic info ------------------------------------------------------- */
  const map = {
    'First Name'      :'spl-input#first-name-input',
    'Last Name'       :'spl-input#last-name-input',
    Email             :'spl-input#email-input',
    'Location (City)' :'spl-autocomplete[data-test="location-autocomplete"]',
    'LinkedIn Profile':'spl-input#linkedin-input',
    Website           :'spl-input#website-input'
  };

  if(u.Phone){
    const host = await frame.$('spl-phone-field#spl-form-element_5');
    const tel  = host && await host.evaluateHandle(el=>
       el.shadowRoot?.querySelector('spl-input')?.shadowRoot?.querySelector('input')
    ).then(h=>h.asElement());
    if(tel){
      await tel.click({ clickCount:3 });
      await tel.type(String(u.Phone),{delay:35});
    }
  }

  for(const [k,sel] of Object.entries(map)){
    if(!u[k]) continue;
    console.log(`  → ${k}`);
    const host = await frame.$(sel);
    if(!host) continue;
    const fld = k==='Location (City)'
      ? await host.evaluateHandle(el=>el.shadowRoot?.querySelector('spl-input')?.shadowRoot?.querySelector('input')).then(h=>h.asElement())
      : await native(frame,host);
    if(!fld) continue;
    await fld.fill(String(u[k]));
    if(k==='Location (City)'){
      await delay(frame,800,1000);
      await frame.keyboard.press('ArrowDown');
      await frame.keyboard.press('Enter');
    }
    if(k==='Email'){
      const cfHost = await frame.$('spl-input#confirm-email-input');
      const cf     = await native(frame, cfHost);
      if(cf) await cf.fill(String(u[k]));
    }
  }

  /* experience + education pop-ups ---------------------------------- */
  await addExperiences(frame,page,u.experiences||[]);
  await addEducations (frame,page,u.educations ||[]);

  /* next ------------------------------------------------------------- */
  await clickDeep(frame,'oc-button[data-test="footer-next"]');
  await delay(frame,4200,4600);
}


/* translate various boolean / string inputs → "Yes" | "No" ------------- */
function yesNo(v) {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  const s = String(v ?? '').trim().toLowerCase();
  if (['yes', 'y', 'true',  '1'].includes(s)) return 'Yes';
  if (['no',  'n', 'false', '0'].includes(s)) return 'No';
  return '';                     // "prefer not to answer" / empty
}

function buildScreening(u) {
  const today = new Date().toLocaleDateString('en-US');
  const sig   = `${u['First Name'] || ''} ${u['Last Name'] || ''}`.trim();

  /* we accept either the simple camel-case keys or the long labels
     that come through in baseData -------------------------------- */
  const authorizedRaw  =
        u.authorized_to_work ??
        u['Do you have unlimited and unrestricted authorization to work in the United States?'];

  const sponsorRaw     =
        u.needs_sponsorship ??
        u['Will you, now or in the future, require company assistance or sponsorship…?'];

  return {
    'Are you legally authorized to work in the country in which you are applying for a role?':
        yesNo(authorizedRaw),

    'Do you now, or will you in the future, require visa sponsorship to work for ServiceNow in the country of hire?':
        yesNo(sponsorRaw),

    /* --- everything below is exactly the same as before ---------- */
    'Name (Signature Field):' : sig,
    "Today's date"            : today,
    Gender                    : srMaps.gender(u.Gender),
    'Race/Ethnicity'          : srMaps.race(u.Race),
    'Do you have (or have a history/record of having) a disability?' :
        srMaps.disability(u['Disability Status']),
    'Are you a protected veteran?' :
        srMaps.veteran(u['Veteran Status'])
  };
}







/* overwrite the old helper ---------------------------------------- */
async function fillCombo(frame, placeholder, value) {
  if (!value) return;

  // 1⃣  locate the host <spl-autocomplete … placeholder="…"> or fallback <input>
  const host = await frame.$(
    `spl-autocomplete[placeholder="${placeholder}"], input[placeholder="${placeholder}"]`
  );
  if (!host) return;

  // 2⃣  drill into the real <input> (two shadow layers for spl-autocomplete)
  const input =
    (await host.evaluateHandle(el => {
      if (el.tagName.toLowerCase() === 'input') return el;          // simple case
      const splInput =
        el.shadowRoot?.querySelector('spl-input')?.shadowRoot?.querySelector('input') ||
        el.shadowRoot?.querySelector('input');
      return splInput;
    })).asElement();
  if (!input) return;

  // 3⃣  type the value
  await input.click({ clickCount: 3 });
  await input.type(value, { delay: 35 });
  await delay(frame, 800, 1000);          // give the dropdown time to populate

  /* 4⃣  try to pick the exact option from the dropdown panel -------- */
  // every suggestion is rendered as an <spl-option> element inside a
  // floating panel attached to <body>.  We look for the exact match.
  const optSelector = `//spl-option[normalize-space(text()) = "${value}"]`;
  const option = await frame.$(optSelector);
  if (option) {
    await option.click({ force: true });
  } else {
    /* fallback: just press Enter → flatpickr keeps the typed text     */
    await input.press('Enter');
  }

  await delay(frame, 300, 500);           // allow Angular to register the change
}


const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();



/* ───────────────── helper: pick a <spl-radio> by its visible label ── */
async function chooseRadioByLabel(frame, block /* the question container */, wanted) {
  if (!block || !wanted) return false;
  const target = norm(wanted);                 // e.g. “no”, “yes”, “prefer…”
  const radios = await block.$$('[role="radio"], spl-radio');
  for (const r of radios) {
    const outer = (await r.getAttribute('label') || '').trim();
    const inner = (await r.innerText() || '').trim();
    const cand  = norm(outer || inner);
    if (!cand) continue;
    if (cand === target || cand.startsWith(target)) {
      /* visual click */
      await r.click({ force: true });

      /* tick the real <input> inside the shadow-root so Angular sees it */
      await r.evaluate(el => {
        const real = el.shadowRoot?.querySelector('input[type=radio]');
        if (real) {
          real.checked = true;
          real.setAttribute('aria-checked', 'true');
          ['input', 'change'].forEach(ev =>
            real.dispatchEvent(new Event(ev, { bubbles: true })));
        }
        el.setAttribute('checked', '');
      });
      return true;
    }
  }
  return false;
}




/* ---------------------------------------------------------------
   Helper — handle any <spl-autocomplete> living inside a question
---------------------------------------------------------------- */
async function fillAutoCompleteInBlock(frame, block, value) {
  if (!value) return false;
  const host = await block.$('spl-autocomplete');
  if (!host) return false;
  await fillAutoComplete(frame, host, value);   // ← our proven helper
  return true;                                  // we’re done
}

/* ----------------------------------------------------------------
   NEW handleScreening (replaces your existing one 1-for-1)
---------------------------------------------------------------- */
async function handleScreening(frame, page, u) {
  await frame.waitForSelector('sr-screening-questions-form',
                              { timeout: 30_000 });

  const answers = buildScreening(u);
  const blocks  = await frame.$$(
    '[data-test="screening-questions-form"] [data-test^="question"]'
  );
  const misses  = [];

  for (const block of blocks) {
    /* 🅰  resolve label → answer ---------------------------------- */
    const labelRaw = (await block.innerText())
                       .split('\n')[0]
                       .replace('*', '')
                       .trim();
    if (!labelRaw) continue;                     // skip empty dividers

    let val = '';
    for (const k in answers) {
      if (norm(k).includes(norm(labelRaw)) ||
          norm(labelRaw).includes(norm(k))) {
        val = answers[k];
        break;
      }
    }
    if (!val) { misses.push(labelRaw); continue; }

    /* 🅱  1st attempt: radio by label ----------------------------- */
    if (await chooseRadioByLabel(frame, block, val)) continue;

    /* 🅲  2nd attempt: <spl-autocomplete> combobox ---------------- */
    if (await fillAutoCompleteInBlock(frame, block, val)) continue;

    /* 🅳  3rd attempt: regular <select>/<input> ------------------- */
    let field = await block.$('input,textarea,select,[role="combobox"]');
    if (!field) { misses.push(labelRaw); continue; }

    const tag  = await field.evaluate(el => el.tagName.toLowerCase());
    const type = (await field.getAttribute('type') || '').toLowerCase();
    const role = await field.getAttribute('role');

    try {
      if (tag === 'textarea') {
        await field.fill(val);

      } else if (tag === 'select') {
        await field.selectOption({ label: val }).catch(async () => {
          await field.click();
          await delay(frame, 800, 1000);
          await frame.keyboard.press('ArrowDown');
          await frame.keyboard.press('Enter');
        });

      } else if (tag === 'input' && ['radio', 'checkbox'].includes(type)) {
        await field.check({ force: true });

      } else if (role === 'combobox' || (tag === 'input' && type === 'text')) {
        await field.fill(val);
        await delay(frame, 800, 1000);
        await frame.keyboard.press('ArrowDown');
        await frame.keyboard.press('Enter');
      }

    } catch { misses.push(labelRaw); }
  }

  /* explicit autocompletes that sit *outside* normal blocks ------ */
  await fillCombo(frame, 'Gender',         answers.Gender);
  await fillCombo(frame, 'Race/Ethnicity', answers['Race/Ethnicity']);

  /* any stragglers → GPT fallback -------------------------------- */
  if (misses.length) {
    console.log('[INFO] LLM fallback for screening:', misses);
    let prompt = 'Fill the remaining required questions and press **Submit**:\n';
    for (const m of misses) prompt += `- ${m}: ${answers[m] || ''}\n`;
    await page.ai(prompt);
    await delay(frame, 2200, 2600);
  }

  /* privacy checkbox + submit ------------------------------------ */
  await tickCheckbox(frame,
    'oc-checkbox[data-test="consent-box"] spl-checkbox');

  await clickDeep(frame, 'oc-button[data-test="footer-submit"]');
  await delay(frame, 4800, 5200);
}







async function applyToSmartRecruiters(url,userData){
  if(!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
  const agent=new HyperAgent({ llm:new ChatOpenAI({
      modelName:'gpt-4o-mini', openAIApiKey:process.env.OPENAI_API_KEY })});
  const page=await agent.newPage();
  try{
    console.log('[INFO] Navigating to',url);
    await page.goto(url,{waitUntil:'load',timeout:60_000});
    let frame=page;
    const iframe=await page.$('iframe[src*="smartrecruiters.com"]');
    if(iframe){const f=await iframe.contentFrame();if(f){frame=f;console.log('[INFO] in iframe');}}
    await frame.waitForSelector('oc-personal-information',{state:'visible',timeout:30_000});
    await delay(frame,600,900);
    await handleFirstPage(frame,page,userData);
    await handleScreening(frame,page,userData);
    console.log('✅ SmartRecruiters automation complete');
  }finally{ await agent.closeAgent(); }
}
module.exports = { applyToSmartRecruiters };
