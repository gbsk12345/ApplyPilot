/* ────────────────────────────────────────────────────────────────
   backend/services/autoApply.js   (Greenhouse / generic forms)
   ────────────────────────────────────────────────────────────── */
try { require('@img/sharp-libvips-darwin-arm64'); } catch {}
require('dotenv').config();

const { ChatOpenAI } = require('@langchain/openai');
const { HyperAgent } = require('@hyperbrowser/agent');
const path = require('path');
const fs   = require('fs');

/* small helpers -------------------------------------------------- */
const normalize = s =>
  typeof s === 'string'
    ? s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    : '';

async function getElementById(page, id) {
  /** return ElementHandle|null without using CSS selectors */
  if (!id) return null;
  const h = await page.evaluateHandle(i => document.getElementById(i), id);
  return h.asElement() || null;
}

/* ────────────────────────────────────────────────────────────────
   main helper
   ────────────────────────────────────────────────────────────── */
async function applyToJob(url, userData) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');

  /* 0) spin-up HyperAgent + page */
  const agent = new HyperAgent({
    llm: new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName   : 'gpt-4o-mini'
    })
  });
  const page = await agent.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  /* 1) build a quick lookup map */
  const map = {};
  for (const k in userData) {
    const key = normalize(k);
    if (key) map[key] = userData[k];
  }

  /* 2) resume upload (if Greenhouse shows the standard hidden <input>) */
  const resumeInput = await page.$('input[type="file"][id="resume"]');
  if (resumeInput) {
    const pdf = path.resolve(__dirname, 'resume.pdf');
    if (!fs.existsSync(pdf)) throw new Error(`resume.pdf not found at ${pdf}`);
    await resumeInput.setInputFiles(pdf);
    await resumeInput.dispatchEvent('change');
    await resumeInput.dispatchEvent('input');
    await page.waitForTimeout(1200);
    console.log('✅  Resume uploaded');
  }

  /* 3) iterate over labels on the form */
  const labels  = await page.$$('form[id*="application"] label');
  const misses  = [];

  for (const lbl of labels) {
    const raw       = (await lbl.innerText()).replace('*', '').trim();
    const normLabel = normalize(raw);
    if (!normLabel) continue;

    /* ── locate matching field ────────────────────────────── */
    const forId = await lbl.getAttribute('for');
    let field   = (await getElementById(page, forId))            // <label for="">
                || (await lbl.evaluateHandle(el =>
                      el.closest('div')?.querySelector(
                        'input,textarea,select,[role="combobox"]')
                   ).then(h => h.asElement()));

    if (!field) { misses.push({ raw, normLabel }); continue; }

    /* ── choose a value ───────────────────────────────────── */
    let value = map[normLabel] || '';
    if (!value) {
      const alt = Object.keys(map).find(k => k.includes(normLabel) || normLabel.includes(k));
      if (alt) value = map[alt];
    }
    if (!value) { misses.push({ raw, normLabel }); continue; }

    value = String(value);                    // ← ensure **string**

    /* ── inspect element type ─────────────────────────────── */
    const tag  = await field.evaluate(el => el.tagName.toLowerCase());
    const type = (await field.getAttribute('type') || '').toLowerCase();
    const role = await field.getAttribute('role');

    console.log(`Filling "${raw}" → ${value}`);

    try {
      if (tag === 'textarea' ||
         (tag === 'input' && ['text','email','tel','number','url',
                              'search','password','date'].includes(type))) {
        if (role === 'combobox') {
          await field.click({ force: true });
          await field.fill(value);
          await page.waitForTimeout(1200);
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        } else {
          await field.fill(value);
        }
      } else if (tag === 'select') {
        await field.selectOption({ label: value }).catch(async () => {
          await field.click();
          await page.waitForTimeout(1200);
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        });
      } else if (tag === 'input' && type === 'checkbox') {
        if (['true','yes','1','on'].includes(value.toLowerCase()))
          await field.check({ force: true });
      } else {
        misses.push({ raw, normLabel });
      }
    } catch { misses.push({ raw, normLabel }); }

    await page.waitForTimeout(150);
  }

  /* 4) let the LLM mop up the tricky leftovers */
  if (misses.length) {
    console.log('🤖  LLM fallback for:', misses.map(m => m.raw));
    let prompt = 'Fill the remaining fields with the given values:\n';
    for (const { raw, normLabel } of misses) {
      prompt += `- ${raw}: ${map[normLabel] || ''}\n`;
    }
    prompt += '\nFor dropdowns: after typing, wait ~1.5 s then press ↓ + Enter.';
    await page.ai(prompt);
  }

  /* 5) (optional) auto-submit
  const submit = await page.$('button[type="submit"],input[type="submit"]');
  if (submit) {
    await submit.click();
    console.log('✅  Form submitted');
  }
  */

  // await agent.closeAgent();   // keep session alive for debugging
}

module.exports = { applyToJob };
