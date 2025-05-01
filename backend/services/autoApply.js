// services/autoApply.js -------------------------------------------------------
try { require('@img/sharp-libvips-darwin-arm64'); } catch {}
require('dotenv').config();
const fs             = require('fs');
const path           = require('path');
const sim            = require('string-similarity');
const { ChatOpenAI } = require('@langchain/openai');
const { HyperAgent } = require('@hyperbrowser/agent');

const LOG  = m => console.log(`[▶] ${m}`);
const STEP = s => { console.log(`\n====== STEP ${s.idx} ======`); console.dir(s, {depth:null}); };

const norm = s => typeof s === 'string'
  ? s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  : '';

// ───────────────────────────────── helpers ───────────────────────────────────
async function waitFrame(page, ms = 30_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const fr = page.frames().find(f => f.url().includes('boards.greenhouse.io'));
    if (fr) return fr;
    await page.waitForTimeout(200);
  }
  return null;
}

async function visibleControl(label) {
  return (await label.evaluateHandle(el => {
    const root = el.closest('.field');
    if (!root) return null;
    return root.querySelector(
      'span.select2-container, ' +
      'input:not([type=hidden]):not([style*="display:none"]), ' +
      'textarea:not([style*="display:none"]), ' +
      'select:not([style*="display:none"])'
    );
  })).asElement();
}

// improved Select2 helper (v3 & v4)
async function fillSelect2(wrapper, frame, value) {
  // open
  const opener = await wrapper.$('a.select2-choice, span.select2-selection') || wrapper;
  await opener.click({ force: true });
  await frame.waitForTimeout(250);

  // searchable?
  const search = await frame.$('div.select2-drop:visible input.select2-input');
  if (search) {
    await search.type(String(value), { delay: 50 });
    await frame.waitForTimeout(1500);

    // try clicking exact match
    const exactLi = await frame.$(
      `//div[contains(@class,"select2-drop") and contains(@style,"display: block")]` +
      `//li[normalize-space() = "${value}"]`
    );
    if (exactLi) {
      await exactLi.click({ force: true });
      return;
    }
    // fallback – keyboard
    await frame.keyboard.press('ArrowDown').catch(() => {});
    await frame.keyboard.press('Enter').catch(() => {});
    return;
  }

  // non-searchable: click first li that matches
  const li = await frame.$(
    `//div[contains(@class,"select2-drop") and contains(@style,"display: block")]` +
    `//li[normalize-space() = "${value}"]`
  );
  if (li) { await li.click(); return; }

  // otherwise click first option
  const first = await frame.$('div.select2-drop:visible li');
  if (first) await first.click();
}

// ───────────────────────────────── main ──────────────────────────────────────
async function applyToJob(url, userData) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');

  const agent = new HyperAgent({
    llm: new ChatOpenAI({ modelName: 'gpt-4o-mini', openAIApiKey: process.env.OPENAI_API_KEY })
  });
  const page = await agent.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const frame = await waitFrame(page);
  if (!frame) throw new Error('❌ cannot find Greenhouse iframe');
  LOG('iframe ready');

  // upload resume
  const resume = path.resolve(__dirname, 'resume.pdf');
  if (fs.existsSync(resume)) {
    try {
      const btn  = await frame.$('fieldset#resume_fieldset button[data-source="attach"]');
      if (btn) {
        const [chooser] = await Promise.all([ page.waitForEvent('filechooser'), btn.click() ]);
        await chooser.setFiles(resume);
        await frame.waitForTimeout(5000);
        LOG('Resume uploaded ✅');
      }
    } catch (e) { console.warn('resume upload failed ->', e.message); }
  }

  // build lookup
  const store = {};
  Object.entries(userData).forEach(([k,v]) => store[norm(k)] = v);
  const keys = Object.keys(store);
  const lookup = label => {
    const direct = store[norm(label)];
    if (direct !== undefined) return direct;
    const { bestMatch } = sim.findBestMatch(norm(label), keys);
    return bestMatch.rating >= .55 ? store[bestMatch.target] : undefined;
  };

  // loop labels
  const labels = await frame.$$('form#application_form label');
  const miss   = [];
  for (const lbl of labels) {
    const raw = (await lbl.innerText()).replace('*','').trim();
    if (!raw) continue;
    if (['resume/cv','cover letter'].includes(norm(raw))) continue;

    let ctl = null;
    const forId = await lbl.getAttribute('for');
    if (forId) ctl = await frame.$(`#${forId}:not([type=hidden])`);
    if (!ctl) ctl = await visibleControl(lbl);
    if (!ctl) { miss.push(raw); continue; }

    const val = lookup(raw);
    if (val === undefined) { miss.push(raw); continue; }

    const tag  = await ctl.evaluate(e=>e.tagName.toLowerCase());
    const type = (await ctl.getAttribute('type')||'').toLowerCase();
    const cls  = await ctl.getAttribute('class')||'';
    const isS2 = cls.includes('select2-container');

    LOG(`fill ${raw} → "${val}" [${tag}${isS2?',select2':''}]`);
    try {
      if (isS2 || tag==='span' && cls.includes('select2-container')) {
        await fillSelect2(ctl, frame, val);
      } else if (tag==='select') {
        await ctl.selectOption({ label: val }).catch(()=>ctl.selectOption({ value: val }));
      } else if (tag==='textarea' || (tag==='input' && ['text','email','tel','url','search','number','date'].includes(type))) {
        await ctl.fill(String(val));
      } else if (tag==='input' && type==='checkbox') {
        const truthy = ['yes','true','1','on'].includes(String(val).toLowerCase());
        await (truthy ? ctl.check({force:true}) : ctl.uncheck({force:true}));
      } else miss.push(raw);
    } catch(e){ miss.push(raw); LOG(`  ⚠ ${e.message}`); }

    await frame.waitForTimeout(150);
  }

  // LLM fallback
  if (miss.length) {
    LOG(`LLM fallback (${miss.length})`);
    const prompt = ['Fill these fields:\n', ...miss.map(m=>`- ${m}: ${lookup(m)||''}`)].join('');
    await page.ai(prompt, { onStep: STEP });
  }

  // submit
  const submit = await frame.$('#submit_app, button[type=submit], input[type=submit]');
  if (submit) { await submit.click(); LOG('submitted ✅'); }
  else LOG('⚠ submit button not found');

  await agent.closeAgent();
  LOG('done');
}

module.exports = { applyToJob };
