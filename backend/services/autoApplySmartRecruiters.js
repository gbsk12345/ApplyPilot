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
const rnd   = (a, b)   => Math.floor(Math.random() * (b - a + 1)) + a;
const delay = (p, a, b) => p.waitForTimeout(rnd(a, b));

/*  Grab the real <input>/<textarea> living inside host’s shadow DOM  */
async function native(frame, host) {
  if (!host) return null;
  for (let i = 0; i < 10; i++) {
    const h  = await host.evaluateHandle(el =>
      (el.shadowRoot || el).querySelector('input,textarea')
    );
    const el = h.asElement();
    if (el && await el.isVisible()) return el;
    await delay(frame, 300, 300);
  }
  return null;
}

/*  Fire a full click down the oc-button → spl-button → <button> stack */
async function clickDeep(frame, selector) {
  const oc  = await frame.$(selector);
  const spl = oc && await oc.evaluateHandle(el =>
            el.shadowRoot?.querySelector('spl-button')).then(h => h.asElement());
  const btn = spl && await spl.evaluateHandle(el =>
            el.shadowRoot?.querySelector('button')).then(h => h.asElement());

  const tap = async el => {
    await el.scrollIntoViewIfNeeded();
    await el.dispatchEvent('pointerdown');
    await el.dispatchEvent('pointerup');
    await el.dispatchEvent('click', { bubbles: true });
  };

  if (btn) { await tap(btn); return true; }
  if (spl) { await tap(spl); return true; }
  if (oc)  { await tap(oc);  return true; }
  return false;
}

/* ── deep <spl-autocomplete> helper ─────────────────────────────── */
async function fillAutoComplete(frame, host, value) {
  if (!value || !host) return false;

  const input = await host.evaluateHandle(el => {
    // deepest native input we can find
    const dive = n =>
      n?.shadowRoot?.querySelector('spl-input')?.shadowRoot?.querySelector('input') ||
      n?.shadowRoot?.querySelector('input');
    return dive(el);
  }).then(h => h.asElement());

  if (!input) return false;

  await input.fill(value);
  await delay(frame, 700, 900);
  await frame.keyboard.press('ArrowDown');
  await frame.keyboard.press('Enter');
  return true;
}

/* ── month-year <spl-date-field> helper ─────────────────────────── */
async function fillDateField(frame, host, month, year) {
  if (!(month || year) || !host) return false;

  const input = await host.evaluateHandle(el =>
    el.shadowRoot?.querySelector('input')
  ).then(h => h.asElement());

  if (!input) return false;

  const monthIdx = month
    ? ('0' + (new Date(`${month} 1`).getMonth() + 1)).slice(-2)
    : '01';
  const valueISO = `${year || '2000'}-${monthIdx}`; // YYYY-MM

  await input.fill(valueISO);
  await input.press('Enter');
  await input.dispatchEvent('change');
  await input.dispatchEvent('blur');
  await delay(frame, 400, 600);
  return true;
}

/* ────────────────────────────────────────────────────────────────────
   EXPERIENCE pop-up (many rows)
   ────────────────────────────────────────────────────────────────── */
async function addExperiences(frame, page, exps = []) {
  if (!exps.length) return;
  console.log(`[INFO] Adding ${exps.length} experience entr${exps.length === 1 ? 'y' : 'ies'}`);

  for (const exp of exps) {
    await clickDeep(frame, 'oc-button[data-test="add-experience"]');
    await frame.waitForSelector('oc-experience-edit-form', { timeout: 15_000 });
    const form = await frame.$('oc-experience-edit-form');
    await delay(frame, 800, 1000);

    /* Job title */
    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[data-test="job-title-autocomplete"]'),
      exp.job_title);

    /* Company */
    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[data-test="company-autocomplete"]'),
      exp.company_name);

    /* Office location */
    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[data-test="location-autocomplete"]'),
      exp.company_location);

    /* Description */
    if (exp.job_description) {
      const descHost = await form.$('spl-textarea[id^="exp-desc"]');
      const descInp  = await native(frame, descHost);
      if (descInp) await descInp.fill(exp.job_description);
    }

    /* Dates */
    await fillDateField(
      frame,
      await form.$('spl-date-field[label="From"]'),
      exp.start_month,
      exp.start_year
    );
    await fillDateField(
      frame,
      await form.$('spl-date-field[label="To"]'),
      exp.end_month,
      exp.end_year
    );

    /* Current-job checkbox */
    if (exp.current_job) {
      const chkHost = await form.$('oc-checkbox[data-test="experience-current"]');
      const realChk = chkHost && await chkHost.evaluateHandle(el =>
        el.shadowRoot?.querySelector('spl-checkbox')?.shadowRoot?.querySelector('input')
      ).then(h => h.asElement());
      if (realChk && !(await realChk.isChecked())) await realChk.click({ force: true });
    }

    /* Save */
    await clickDeep(form, 'oc-button[data-test="experience-save"]');
    await delay(frame, 1800, 2200);
  }
}

/* ────────────────────────────────────────────────────────────────────
   EDUCATION pop-up (many rows)
   ────────────────────────────────────────────────────────────────── */
async function addEducations(frame, page, edus = []) {
  if (!edus.length) return;
  console.log(`[INFO] Adding ${edus.length} education entr${edus.length === 1 ? 'y' : 'ies'}`);

  for (const edu of edus) {
    await clickDeep(frame, 'oc-button[data-test="add-education"]');
    await frame.waitForSelector('oc-education-edit-form', { timeout: 15_000 });
    const form = await frame.$('oc-education-edit-form');
    await delay(frame, 800, 1000);

    /* School */
    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[label="School"], spl-autocomplete[data-test="school-autocomplete"]'),
      edu.school_name);

    /* Degree */
    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[label="Degree"], spl-autocomplete[data-test="degree-autocomplete"]'),
      edu.degree_level);

    /* Field of study */
    await fillAutoComplete(frame,
      await form.$('spl-autocomplete[label="Field of study"], spl-autocomplete[data-test="field-of-study-autocomplete"]'),
      edu.major);

    /* Dates */
    await fillDateField(
      frame,
      await form.$('spl-date-field[label="From"]'),
      edu.start_month,
      edu.start_year
    );
    await fillDateField(
      frame,
      await form.$('spl-date-field[label="To"]'),
      edu.end_month,
      edu.end_year
    );

    /* Save */
    await clickDeep(form, 'oc-button[data-test="education-save"]');
    await delay(frame, 1800, 2200);
  }
}

/* ────────────────────────────────────────────────────────────────────
   FIRST PAGE – resume + personal info + exp/edu
   ────────────────────────────────────────────────────────────────── */
async function handleFirstPage(frame, page, u) {
  /* ── 0) upload resume (same logic as before) ──────────────────── */
  const pdf = path.resolve(__dirname, 'resume.pdf');
  if (fs.existsSync(pdf)) {
    console.log('[INFO] Uploading resume…');
    const dz = await frame.$('spl-dropzone[data-test="resume-upload"]');
    if (dz) {
      const hiddenInput = await dz.evaluateHandle(el => {
        /* DFS to find <input type=file> even across nested shadows */
        const dfs = n => {
          if (!n) return null;
          if (n.matches && n.matches('input[type="file"]')) return n;
          const kids = [
            ...(n.children || []),
            ...(n.shadowRoot ? Array.from(n.shadowRoot.children) : [])
          ];
          for (const k of kids) { const r = dfs(k); if (r) return r; }
          return null;
        };
        return dfs(el);
      }).then(h => h.asElement());

      if (hiddenInput) {
        await hiddenInput.setInputFiles(pdf);
        await hiddenInput.dispatchEvent('change');
        await hiddenInput.dispatchEvent('input');
        await delay(frame, 2500, 3000);
      }
    }
  }

  /* ── 1) base person fields ───────────────────────────────────── */
  const fieldMap = {
    'First Name'      : 'spl-input#first-name-input',
    'Last Name'       : 'spl-input#last-name-input',
    Email             : 'spl-input#email-input',
    'Location (City)' : 'spl-autocomplete[data-test="location-autocomplete"]',
    'LinkedIn Profile': 'spl-input#linkedin-input',
    Website           : 'spl-input#website-input',
    Message           : 'spl-textarea#hiring-manager-message-input'
  };

  /* phone: special widget */
  if (u.Phone) {
    const host = await frame.$('spl-phone-field#spl-form-element_5');
    if (host) {
      const telInp = await host.evaluateHandle(el =>
        el.shadowRoot?.querySelector('spl-input')?.shadowRoot?.querySelector('input')
      ).then(h => h.asElement());
      if (telInp) {
        await telInp.click({ clickCount: 3 });
        await telInp.type(String(u.Phone), { delay: 40 });
        await frame.keyboard.press('Tab');
      }
    }
  }

  for (const [key, sel] of Object.entries(fieldMap)) {
    if (!u[key]) continue;
    console.log(`  → ${key}`);
    const host = await frame.$(sel);
    if (!host) continue;

    let fld;
    if (key === 'Location (City)') {
      const h = await host.evaluateHandle(el =>
        el.shadowRoot?.querySelector('spl-input')?.shadowRoot?.querySelector('input')
      ).then(k => k.asElement());
      fld = h;
    } else {
      fld = await native(frame, host);
    }
    if (!fld) continue;

    await fld.click({ clickCount: 1 });
    await fld.fill(String(u[key]));

    if (key === 'Location (City)') {
      await delay(frame, 900, 1100);
      await frame.keyboard.press('ArrowDown');
      await frame.keyboard.press('ArrowUp');
      await frame.keyboard.press('Enter');
    }

    /* confirm-email */
    if (key === 'Email') {
      const confHost = await frame.$('spl-input#confirm-email-input');
      const confInp  = await native(frame, confHost);
      if (confInp) await confInp.fill(String(u[key]));
    }
  }

  /* ── 2) experiences / educations ─────────────────────────────── */
  await addExperiences(frame, page, u.experiences || []);
  await addEducations (frame, page, u.educations  || []);

  /* ── 3) next → go screening ──────────────────────────────────── */
  await clickDeep(frame, 'oc-button[data-test="footer-next"]');
  await delay(frame, 4500, 5000);
}

/* ────────────────────────────────────────────────────────────────────
   SCREENING page helpers (unchanged except keeps new fields)
   ────────────────────────────────────────────────────────────────── */
function buildScreening(u) {
  const def = v => u[v] || 'No';
  const today = new Date().toLocaleDateString('en-US');
  const sig   = `${(u['First Name'] || '')} ${(u['Last Name'] || '')}`.trim();

  return {
    'Have you ever worked at ServiceNow in any capacity': def('Worked at ServiceNow'),
    'If applicable, would you consider relocating for a role with ServiceNow?': u['Consider relocating'] || 'Yes',
    'Is your current employer a customer of ServiceNow?': def('Employer customer'),
    'Are you legally authorized to work in the country in which you are applying for a role?': u['Authorized to work'] || 'Yes',
    'Do you now, or will you in the future, require visa sponsorship to work for ServiceNow in the country of hire?': u['Need sponsorship'] || 'No',
    'Are you currently employed or have you ever been employed by PwC?': def('Worked at PwC'),
    'Are you a citizen or lawful permanent resident of Cuba, Syria, Iran, North Korea, or the Crimea, Donetsk, or Luhansk regions of Ukraine?': def('Citizen restricted'),
    'A. Have you ever been an employee of the U.S. Federal Government?': def('Fed employee'),
    'B. Are you a current employee of the U.S. Federal Government': def('Current fed'),
    'C. Have you ever been an employee of a state, local, or municipal government entity': def('State employee'),
    'D. Has a member of your Immediate Family': def('Immediate family gov'),
    'E. Are you currently, or have you been previously, suspended': def('Suspended'),
    'Name (Signature Field):': sig,
    "Today's date": today,
    Gender              : u.Gender || 'Prefer not to answer',
    'Race/Ethnicity'    : u.Race   || 'Prefer not to answer',
    'Do you have (or have a history/record of having) a disability?':
      u['Disability Status'] || 'I do not want to answer.',
    'Are you a protected veteran?':
      u['Veteran Status']    || 'Prefer not to answer'
  };
}

async function fillCombo(frame, placeholder, value) {
  if (!value) return;
  const inp = await frame.$(`input[placeholder="${placeholder}"]`);
  if (!inp) return;
  await inp.fill(value);
  await delay(frame, 1000, 1200);
  await frame.keyboard.press('ArrowDown');
  await frame.keyboard.press('Enter');
}

async function handleScreening(frame, page, u) {
  await frame.waitForSelector('sr-screening-questions-form', { timeout: 30_000 });

  const answers = buildScreening(u);
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const blocks = await frame.$$('[data-test="screening-questions-form"] [data-test^="question"]');

  const unfilled = [];

  for (const block of blocks) {
    const raw   = await block.innerText();
    const label = raw.split('\n')[0].replace('*', '').trim();
    let value   = '';

    for (const k in answers) {
      if (norm(k).includes(norm(label)) || norm(label).includes(norm(k))) {
        value = answers[k];
        break;
      }
    }
    if (!value) { unfilled.push(label); continue; }

    const field = await block.$('input,textarea,select,[role="combobox"]');
    if (!field) { unfilled.push(label); continue; }

    const tag  = await field.evaluate(el => el.tagName.toLowerCase());
    const type = (await field.getAttribute('type') || '').toLowerCase();
    const role = await field.getAttribute('role');

    try {
      if (tag === 'textarea') {
        await field.fill(value);
      } else if (tag === 'select') {
        await field.selectOption({ label: value })
                   .catch(async () => {
                     await field.click();
                     await delay(frame, 1000, 1200);
                     await frame.keyboard.press('ArrowDown');
                     await frame.keyboard.press('Enter');
                   });
      } else if (tag === 'input' && ['radio', 'checkbox'].includes(type)) {
        const opt = await block.$(`label:text-is("${value}")`);
        if (opt) await opt.click({ force: true });
        else await field.check({ force: true });
      } else if (role === 'combobox' || (tag === 'input' && type === 'text')) {
        await field.fill(value);
        await delay(frame, 800, 1000);
        await frame.keyboard.press('ArrowDown');
        await frame.keyboard.press('Enter');
      } else {
        unfilled.push(label);
      }
    } catch {
      unfilled.push(label);
    }
  }

  /* gender / race combo placeholders */
  await fillCombo(frame, 'Gender',         answers.Gender);
  await fillCombo(frame, 'Race/Ethnicity', answers['Race/Ethnicity']);

  /* any leftovers → LLM fallback */
  if (unfilled.length) {
    console.log('[INFO] LLM fallback for screening:', unfilled);
    let prompt = 'Fill all remaining required questions as specified below and press **Submit**:\n';
    for (const l of unfilled) prompt += `- ${l}: ${answers[l] || 'No'}\n`;
    await page.ai(prompt);
    await delay(frame, 2000, 2500);
  }

  /* privacy checkbox + submit */
  const cbHost = await frame.$('oc-checkbox[data-test="consent-box"]');
  if (cbHost) {
    const real = await cbHost.evaluateHandle(el =>
      el.shadowRoot?.querySelector('spl-checkbox')?.shadowRoot?.querySelector('input')
    ).then(h => h.asElement());
    if (real && !(await real.isChecked())) await real.click({ force: true });
  }

  await clickDeep(frame, 'oc-button[data-test="footer-submit"]');
  await delay(frame, 5000, 5500);
}

/* ────────────────────────────────────────────────────────────────────
   MAIN EXPORT
   ────────────────────────────────────────────────────────────────── */
async function applyToSmartRecruiters(url, userData) {
  if (!process.env.OPENAI_API_KEY)
    throw new Error('Missing OPENAI_API_KEY');

  const agent = new HyperAgent({
    llm: new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      openAIApiKey: process.env.OPENAI_API_KEY
    })
  });

  const page = await agent.newPage();

  try {
    console.log(`[INFO] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 });

    /* SmartRecruiters widget may live in an iframe */
    let frame = page;
    const iframe = await page.$('iframe[src*="smartrecruiters.com"]');
    if (iframe) {
      const f = await iframe.contentFrame();
      if (f) { frame = f; console.log('[INFO] Switched into SmartRecruiters iframe'); }
    }

    await frame.waitForSelector('oc-personal-information',
                                { state: 'visible', timeout: 30_000 });
    await delay(frame, 600, 900);

    /* page #1 + exp/edu */
    await handleFirstPage(frame, page, userData);

    /* page #2 screening */
    await handleScreening(frame, page, userData);

    console.log('✅ SmartRecruiters automation complete!');
  } finally {
    await agent.closeAgent();
  }
}

module.exports = { applyToSmartRecruiters };
