/* ────────────────────────────────────────────────────────────────────
   backend/services/autoApplySmartRecruiters.js
   SmartRecruiters “one-click” auto-apply helper
   ────────────────────────────────────────────────────────────────── */
try { require('@img/sharp-libvips-darwin-arm64'); } catch {}
require('dotenv').config();

const { ChatOpenAI } = require('@langchain/openai');
const { HyperAgent } = require('@hyperbrowser/agent');
const path = require('path');
const fs   = require('fs');

/* ── tiny utils ─────────────────────────────────────────────────── */
const rnd   = (a, b)  => Math.floor(Math.random() * (b - a + 1)) + a;
const delay = (p,a,b) => p.waitForTimeout(rnd(a, b));

/* reach into a host’s shadow DOM and return the native input / textarea */
async function native(frame, host){
  if(!host) return null;
  for(let i=0;i<10;i++){
    const h  = await host.evaluateHandle(el => (el.shadowRoot || el).querySelector('input,textarea'));
    const el = h.asElement();
    if(el && await el.isVisible()) return el;
    await delay(frame,300,300);
  }
  return null;
}

/* full “deep click” (oc-button → spl-button → <button>) */
async function clickDeep(frame, sel){
  const oc  = await frame.$(sel);
  const spl = oc  && await oc.evaluateHandle(el => el.shadowRoot?.querySelector('spl-button')).then(h => h.asElement());
  const btn = spl && await spl.evaluateHandle(el => el.shadowRoot?.querySelector('button')).then(h => h.asElement());
  const tap = async el=>{
    await el.scrollIntoViewIfNeeded();
    await el.dispatchEvent('pointerdown');
    await el.dispatchEvent('pointerup');
    await el.dispatchEvent('click', { bubbles:true });
  };
  if(btn){await tap(btn); return true;}
  if(spl){await tap(spl); return true;}
  if(oc) {await tap(oc);  return true;}
  return false;
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

async function fillDate(frame, host, month = '', year = '') {
  if (!host || !(month || year)) return false;

  /* 1⃣  Grab the visible <input> inside the component */
  const inp = await host.evaluateHandle(el =>
    el.shadowRoot?.querySelector('input[data-input]') ||
    el.shadowRoot?.querySelector('input')
  ).then(h => h.asElement());
  if (!inp) return false;

  /* 2⃣  Build both strings we need */
  const m      = month || 'Jan';
  const y      = year  || new Date().getFullYear();
  const typed  = `${m} ${y}`;                  // what we TYPE
  const stored = new Date(`${m} 1, ${y}`).toString(); // what SR expects

  /* 3⃣  Let flatpickr do its thing via typing */
  await inp.click({ clickCount: 3 });
  await inp.type(typed, { delay: 40 });
  await inp.press('Enter');
  await delay(frame, 300, 450);                // wait for picker to settle

  /* 4⃣  Make 100 % sure SR’s form model sees the value */
  await frame.evaluate((field, input, val) => {
    // 4a) set on <spl-date-field>
    field.value = val;
    field.setAttribute('value', val);

    // 4b) set on inner <input>
    input.value = val;

    // 4c) fire events on BOTH
    const evOpts = { bubbles: true };
    input.dispatchEvent(new Event('input',  evOpts));
    input.dispatchEvent(new Event('change', evOpts));
    field.dispatchEvent(new Event('input',  evOpts));
    field.dispatchEvent(new Event('change', evOpts));
  }, host, inp, stored);

  return true;
}


function dateInFuture(month, year){
  if(!year) return false;
  const cmp = new Date(`${month||'January'} 1, ${year}`);
  return cmp > new Date();
}

/* ────────────────── EXPERIENCE pop-up ───────────────────────────── */
async function addExperiences(frame, page, exps=[]){
  if(!exps.length) return;
  console.log(`[INFO] Adding ${exps.length} experience entr${exps.length===1?'y':'ies'}`);

  for(const exp of exps){
    await clickDeep(frame,'oc-button[data-test="add-experience"]');
    await frame.waitForSelector('oc-experience-edit-form',{timeout:15_000});
    const form = await frame.$('oc-experience-edit-form');
    await delay(frame,800,1000);

    /* title / company / location autocompletes */
    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[data-test="job-title-autocomplete"]'),
      exp.job_title);
    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[data-test="company-autocomplete"]'),
      exp.company_name);
    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[data-test="location-autocomplete"]'),
      exp.company_location);

    /* description textarea (native) */
    if(exp.job_description){
      const descHost = await form.$('spl-textarea[id^="exp-desc"]');
      const desc     = await native(frame,descHost);
      if(desc) await desc.fill(exp.job_description);
    }

    /* dates */
    const fromHost = await form.$('spl-date-field[label="From"]');
    const toHost   = await form.$('spl-date-field[label="To"]');

    await fillDate(frame, fromHost, exp.start_month, exp.start_year);
    await fillDate(frame,   toHost, exp.end_month,   exp.end_year);

    /* handle “I currently work here” */
    const markCurrent = exp.current_job || !(exp.end_month||exp.end_year);
    if(markCurrent){
      const chk = await form.evaluateHandle(el=>{
        const host = el.querySelector('oc-checkbox[data-test="experience-current"]');
        return host?.shadowRoot?.querySelector('spl-checkbox')?.shadowRoot?.querySelector('input');
      }).then(h=>h?.asElement());
      if(chk && !(await chk.isChecked())) await chk.click({force:true});
    }

    await clickDeep(form,'oc-button[data-test="experience-save"]');
    await delay(frame,1600,2000);
  }
}

/* ─────────────────── EDUCATION pop-up ───────────────────────────── */
async function addEducations(frame, page, edus=[]){
  if(!edus.length) return;
  console.log(`[INFO] Adding ${edus.length} education entr${edus.length===1?'y':'ies'}`);

  for(const edu of edus){
    await clickDeep(frame,'oc-button[data-test="add-education"]');
    await frame.waitForSelector('oc-education-edit-form',{timeout:15_000});
    const form = await frame.$('oc-education-edit-form');
    await delay(frame,800,1000);

    /* institution / degree / major (all simple spl-inputs) */
    await fillAutoComplete(frame,
      await form.$('spl-input[label="Institution"]'),
      edu.school_name);

    const degreeInput = await native(frame, await form.$('spl-input[label="Degree"]'));
    if(degreeInput) await degreeInput.fill(edu.degree_level || '');

    const majorInput  = await native(frame, await form.$('spl-input[label="Major"]'));
    if(majorInput)  await majorInput.fill(edu.major || '');
    

    /* dates */
    const fromHost = await form.$('spl-date-field[label="From"]');
    const toHost   = await form.$('spl-date-field[label="To"]');

    await fillDate(frame, fromHost, edu.start_month, edu.start_year);
    await fillDate(frame,   toHost, edu.end_month,   edu.end_year);

    /* “I currently attend” checkbox */
    const markCurrent = !(edu.end_month||edu.end_year) ||
                        dateInFuture(edu.end_month, edu.end_year);
    if(markCurrent){
      const chk = await form.evaluateHandle(el=>{
        const host = el.querySelector('oc-checkbox[data-test="education-current"]');
        return host?.shadowRoot?.querySelector('spl-checkbox')?.shadowRoot?.querySelector('input');
      }).then(h=>h?.asElement());
      if(chk && !(await chk.isChecked())) await chk.click({force:true});
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

/* ───────────── SCREENING page helpers (unchanged) ───────────────── */
function buildScreening(u){
  const def=v=>u[v]||'No';
  const today = new Date().toLocaleDateString('en-US');
  const sig   = `${u['First Name']||''} ${u['Last Name']||''}`.trim();
  return {
    'Have you ever worked at ServiceNow in any capacity': def('Worked at ServiceNow'),
    'If applicable, would you consider relocating for a role with ServiceNow?': u['Consider relocating']||'Yes',
    'Is your current employer a customer of ServiceNow?': def('Employer customer'),
    'Are you legally authorized to work in the country in which you are applying for a role?': u['Authorized to work']||'Yes',
    'Do you now, or will you in the future, require visa sponsorship to work for ServiceNow in the country of hire?': u['Need sponsorship']||'No',
    'Are you currently employed or have you ever been employed by PwC?': def('Worked at PwC'),
    'Are you a citizen or lawful permanent resident of Cuba, Syria, Iran, North Korea, or the Crimea, Donetsk, or Luhansk regions of Ukraine?': def('Citizen restricted'),
    'A. Have you ever been an employee of the U.S. Federal Government?': def('Fed employee'),
    'B. Are you a current employee of the U.S. Federal Government': def('Current fed'),
    'C. Have you ever been an employee of a state, local, or municipal government entity': def('State employee'),
    'D. Has a member of your Immediate Family': def('Immediate family gov'),
    'E. Are you currently, or have you been previously, suspended': def('Suspended'),
    'Name (Signature Field):': sig,
    "Today's date": today,
    Gender           : u.Gender            || 'Prefer not to answer',
    'Race/Ethnicity' : u.Race              || 'Prefer not to answer',
    'Do you have (or have a history/record of having) a disability?':
      u['Disability Status']               || 'I do not want to answer.',
    'Are you a protected veteran?': u['Veteran Status'] || 'Prefer not to answer'
  };
}

async function fillCombo(frame, placeholder, value){
  if(!value) return;
  const inp = await frame.$(`input[placeholder="${placeholder}"]`);
  if(!inp) return;
  await inp.fill(value);
  await delay(frame,900,1100);
  await frame.keyboard.press('ArrowDown');
  await frame.keyboard.press('Enter');
}

async function handleScreening(frame,page,u){
  await frame.waitForSelector('sr-screening-questions-form',{timeout:30_000});

  const answers = buildScreening(u);
  const norm = s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const blocks = await frame.$$('[data-test="screening-questions-form"] [data-test^="question"]');

  const unfilled = [];

  for(const b of blocks){
    const raw   = await b.innerText();
    const label = raw.split('\n')[0].replace('*','').trim();
    let val     = '';
    for(const k in answers){
      if(norm(k).includes(norm(label))||norm(label).includes(norm(k))){
        val = answers[k]; break;
      }
    }
    if(!val){unfilled.push(label); continue;}

    const field = await b.$('input,textarea,select,[role="combobox"]');
    if(!field){unfilled.push(label); continue;}

    const tag  = await field.evaluate(el=>el.tagName.toLowerCase());
    const type = (await field.getAttribute('type')||'').toLowerCase();
    const role = await field.getAttribute('role');

    try{
      if(tag==='textarea') await field.fill(val);
      else if(tag==='select'){
        await field.selectOption({ label:val }).catch(async()=>{
          await field.click();
          await delay(frame,800,1000);
          await frame.keyboard.press('ArrowDown'); await frame.keyboard.press('Enter');
        });
      }else if(tag==='input' && ['radio','checkbox'].includes(type)){
        const opt = await b.$(`label:text-is("${val}")`);
        if(opt) await opt.click({force:true}); else await field.check({force:true});
      }else if(role==='combobox' || (tag==='input'&&type==='text')){
        await field.fill(val);
        await delay(frame,800,1000);
        await frame.keyboard.press('ArrowDown');
        await frame.keyboard.press('Enter');
      }else unfilled.push(label);
    }catch{unfilled.push(label);}
  }

  await fillCombo(frame,'Gender',         answers.Gender);
  await fillCombo(frame,'Race/Ethnicity', answers['Race/Ethnicity']);

  if(unfilled.length){
    console.log('[INFO] LLM fallback for screening:',unfilled);
    let prompt='Fill remaining required questions and press **Submit**:\n';
    for(const l of unfilled) prompt+=`- ${l}: ${answers[l]||'No'}\n`;
    await page.ai(prompt);
    await delay(frame,2000,2500);
  }

  const cb = await frame.$('oc-checkbox[data-test="consent-box"]');
  if(cb){
    const real = await cb.evaluateHandle(el=>
      el.shadowRoot?.querySelector('spl-checkbox')?.shadowRoot?.querySelector('input')
    ).then(h=>h.asElement());
    if(real && !(await real.isChecked())) await real.click({force:true});
  }
  await clickDeep(frame,'oc-button[data-test="footer-submit"]');
  await delay(frame,4800,5200);
}

/* ─────────────────── MAIN EXPORT ───────────────────────────────── */
async function applyToSmartRecruiters(url,userData){
  if(!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');

  const agent = new HyperAgent({
    llm: new ChatOpenAI({
      modelName:'gpt-4o-mini',
      openAIApiKey:process.env.OPENAI_API_KEY
    })
  });
  const page = await agent.newPage();

  try{
    console.log(`[INFO] Navigating to ${url}`);
    await page.goto(url,{waitUntil:'load',timeout:60_000});

    let frame = page;
    const iframe = await page.$('iframe[src*="smartrecruiters.com"]');
    if(iframe){
      const f=await iframe.contentFrame();
      if(f){frame=f; console.log('[INFO] Switched into SmartRecruiters iframe');}
    }

    await frame.waitForSelector('oc-personal-information',{state:'visible',timeout:30_000});
    await delay(frame,600,900);

    await handleFirstPage(frame,page,userData);   // personal + exp/edu + next
    await handleScreening(frame,page,userData);   // screening + submit

    console.log('✅ SmartRecruiters automation complete!');
  }finally{
    await agent.closeAgent();
  }
}

module.exports = { applyToSmartRecruiters };
