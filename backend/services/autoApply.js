// services/autoApply.js
try { require('@img/sharp-libvips-darwin-arm64'); } catch {}
require('dotenv').config();

const fs   = require('fs');
const path = require('path');
const sim  = require('string-similarity');

const { ChatOpenAI } = require('@langchain/openai');
const { HyperAgent } = require('@hyperbrowser/agent');

const LOG  = m => console.log(`[▶] ${m}`);
const STEP = s => { console.log(`\n===== STEP ${s.idx} =====`); console.dir(s,{depth:null}); };

const norm = s => typeof s === 'string'
  ? s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  : '';

//──────────────────────── helpers ────────────────────────
async function greenhouseFrame(page, timeout = 30_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const fr = page.frames().find(f => f.url().includes('boards.greenhouse.io'));
    if (fr) return fr;
    await page.waitForTimeout(200);
  }
  return null;
}

async function findVisibleField(frame, labelEl) {
  // 1) by 'for' attribute
  const forId = await labelEl.getAttribute('for');
  if (forId) {
    const el = await frame.$(`#${forId}`);
    if (el && await el.isVisible({ timeout: 200 }).catch(()=>false)) return el;
  }
  // 2) first visible widget in same “field” container
  const container = await labelEl.evaluateHandle(el => el.closest('.field'));
  if (container) {
    const el = (await container.asElement().$$(
      'span.select2-container,' +
      'div.select2-container,' +
      'div.select__control,' +
      'input:not([type=hidden]):not([style*="display:none"]),' +
      'textarea,' +
      'select'
    ))[0];
    return el;
  }
  return null;
}

// robust Select2 v3/v4 filler
async function fillSelect2(wrapper, frame, value) {
  const openBtn = await (wrapper.$('a.select2-choice, span.select2-selection')) || wrapper;
  await openBtn.click({ force:true });
  await frame.waitForTimeout(250);

  // Searchable?
  const search = await frame.$('div.select2-drop:visible input.select2-input');
  if (search) {
    await search.fill('');
    await search.type(String(value), { delay: 45 });
    await frame.waitForTimeout(1500);

    // highlighted row?
    const hi = await frame.$('div.select2-drop:visible li.select2-highlighted');
    if (hi) { await hi.click({ force:true }); return; }

    // first result fallback
    const first = await frame.$('div.select2-drop:visible li.select2-result');
    if (first) { await first.click({ force:true }); return; }

    // keyboard final fallback
    await frame.keyboard.press('Enter').catch(()=>{});
    return;
  }

  // non-searchable variant
  const exact = await frame.$(
    `div.select2-drop:visible li[normalize-space()="${value}"]`
  );
  if (exact) { await exact.click({force:true}); return; }

  const first = await frame.$('div.select2-drop:visible li');
  if (first) await first.click({ force:true });
}

//──────────────────────── main ───────────────────────────
async function applyToJob(url, userData) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');

  const agent = new HyperAgent({
    llm: new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      openAIApiKey: process.env.OPENAI_API_KEY
    })
  });

  const page = await agent.newPage();
  LOG(`goto ${url}`);
  await page.goto(url, { waitUntil: 'networkidle' });

  const frame = await greenhouseFrame(page);
  if (!frame) throw new Error('❌ Greenhouse iframe not found');
  LOG('iframe ready');

  //──────────────── resume upload
  const resumePath = path.resolve(__dirname, 'resume.pdf');
  if (fs.existsSync(resumePath)) {
    try {
      const attach = await frame.$(
        'fieldset#resume_fieldset button[data-source="attach"]'
      );
      if (attach) {
        const [chooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          attach.click()
        ]);
        await chooser.setFiles(resumePath);
        await frame.waitForTimeout(5000);          // give GH JS time
        LOG('Resume uploaded ✅');
      }
    } catch (e) { console.warn('resume upload failed:', e.message); }
  }

  //──────────────── map user data
  const store = {};
  Object.entries(userData).forEach(([k,v]) => { store[norm(k)] = v; });
  const keys = Object.keys(store);
  const lookup = label => {
    const direct = store[norm(label)];
    if (direct !== undefined) return direct;
    const m = sim.findBestMatch(norm(label), keys).bestMatch;
    return m.rating >= .55 ? store[m.target] : undefined;
  };

  //──────────────── iterate labels
  const labels = await frame.$$('form#application_form label');
  const missing = [];
  for (const lbl of labels) {
    const raw = (await lbl.innerText()).replace('*','').trim();
    if (!raw) continue;
    if (['resume/cv','cover letter'].includes(norm(raw))) continue;

    const field = await findVisibleField(frame, lbl);
    if (!field) { missing.push(raw); continue; }

    const val = lookup(raw);
    if (val === undefined) { missing.push(raw); continue; }

    const tag  = await field.evaluate(e => e.tagName.toLowerCase());
    const type = (await field.getAttribute('type')||'').toLowerCase();
    const cls  = await field.getAttribute('class')||'';
    const isS2 = cls.includes('select2-container');

    LOG(`fill ${raw} → "${val}"  [${tag}${isS2?',select2':''}]`);
    try {
      if (isS2 || tag==='span' && cls.includes('select2-container')) {
        await fillSelect2(field, frame, val);
      } else if (tag==='select') {
        await field.selectOption({ label: val }).catch(()=>field.selectOption({ value: val }));
      } else if (tag==='textarea' ||
                (tag==='input' && ['text','email','tel','url','search','number','date'].includes(type))) {
        await field.fill(String(val));
      } else if (tag==='input' && type==='checkbox') {
        const truthy = ['yes','true','1','on'].includes(String(val).toLowerCase());
        await (truthy ? field.check({force:true}) : field.uncheck({force:true}));
      } else {
        missing.push(raw);
      }
    } catch (e) { LOG(`  ⚠ ${e.message}`); missing.push(raw); }

    await frame.waitForTimeout(150);
  }

  //──────────────── LLM fallback
  if (missing.length) {
    LOG(`LLM fallback (${missing.length})`);
    const prompt =
      'Fill the following fields on this Greenhouse form:\n' +
      missing.map(m => `- ${m}: ${lookup(m)||''}`).join('\n');
    await page.ai(prompt, { onStep: STEP });
  }

  //──────────────── submit
  const submit = await frame.$('#submit_app, button[type=submit], input[type=submit]');
  if (submit) { await submit.click(); LOG('submitted ✅'); }
  else LOG('⚠ submit button not found');

  await agent.closeAgent();
  LOG('done');
}

module.exports = { applyToJob };
