// services/autoApply.js
// Load Apple Silicon libvips for Sharp (used by HyperAgent for screenshots)
try { require('@img/sharp-libvips-darwin-arm64'); } catch {}
// Load environment variables
require('dotenv').config();

const { ChatOpenAI } = require('@langchain/openai');
const { HyperAgent } = require('@hyperbrowser/agent');
const path = require('path');
const fs = require('fs');

// Normalize labels and keys to simple strings for matching
function normalize(str) {
  return typeof str === 'string'
    ? str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    : '';
}

/**
 * applyToJob
 * @param {string} url - the job application URL
 * @param {Object} userData - map of label → value for filling
 */
async function applyToJob(url, userData) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  // Initialize LLM + HyperAgent
  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini'
  });
  const agent = new HyperAgent({ llm });

  // Open a new Playwright page via HyperAgent
  const page = await agent.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Build a normalized map of userData
  const userMap = {};
  for (const key in userData) {
    const norm = normalize(key);
    if (norm) userMap[norm] = userData[key];
  }

  // 1) Resume upload via hidden file input
  const resumeSelector = 'input[type="file"][id="resume"]';
  const resumeInput = await page.$(resumeSelector);
  if (resumeInput) {
    const resumePath = path.resolve(__dirname, 'resume.pdf');
    if (!fs.existsSync(resumePath)) {
      throw new Error(`Resume file not found: ${resumePath}`);
    }
    await resumeInput.setInputFiles(resumePath);
    await resumeInput.dispatchEvent('change');
    await resumeInput.dispatchEvent('input');
    await page.waitForTimeout(1500);
    console.log('✅ Resume uploaded');
  }

  // 2) Playwright-first field filling
  const labels = await page.$$('form#application-form label');
  const unfilled = [];

  for (const lbl of labels) {
    const raw = await lbl.innerText();
    const labelText = raw.replace('*', '').trim();
    const normLabel = normalize(labelText);
    if (!normLabel) continue;

    // Find field by `for` attribute
    const forId = await lbl.getAttribute('for');
    let field = forId ? await page.$(`[id="${forId}"]`) : null;
    if (!field) {
      const handle = await lbl.evaluateHandle(el => el.closest('div')?.querySelector('input,textarea,select,[role="combobox"]'));
      field = handle && handle.asElement();
    }
    if (!field) {
      unfilled.push({ labelText, normLabel });
      continue;
    }

    // Determine fill value
    let value = userMap[normLabel] || '';
    if (!value) {
      const key = Object.keys(userMap).find(k => normLabel.includes(k) || k.includes(normLabel));
      if (key) value = userMap[key];
    }
    if (!value) {
      unfilled.push({ labelText, normLabel });
      continue;
    }

    // Inspect field type
    const tag = await field.evaluate(el => el.tagName.toLowerCase());
    const type = (await field.getAttribute('type') || '').toLowerCase();
    const role = await field.getAttribute('role');

    console.log(`Filling ${labelText} → ${value}`);

    // Fill standard controls
    if (tag === 'textarea' || (tag === 'input' && ['text','email','tel','number','url','search','password','date'].includes(type))) {
      if (role === 'combobox') {
        await field.click({ force: true });
        await field.fill(value);
        await page.waitForTimeout(1500);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      } else {
        await field.fill(value);
      }
    } else if (tag === 'select') {
      try {
        await field.selectOption({ label: value });
      } catch {
        await field.click();
        await page.waitForTimeout(1500);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
    } else if (tag === 'input' && type === 'checkbox') {
      if (['true','yes','1','on'].includes(String(value).toLowerCase())) {
        await field.check({ force: true });
      }
    } else {
      unfilled.push({ labelText, normLabel });
    }

    await page.waitForTimeout(200);
  }

  // 3) LLM fallback for unfilled fields
  if (unfilled.length) {
    console.log('LLM fallback for:', unfilled.map(u => u.labelText));
    let prompt = 'Please fill the following remaining fields on this form with the given values. For dropdown/combobox, have a timeout for 1.5 second after typing in query, after typing press down arrow and select first suggestion:\n';
    for (const { labelText, normLabel } of unfilled) {
      prompt += `- ${labelText}: ${userMap[normLabel] || ''}\n`;
    }
    await page.ai(prompt);
  }

  // 4) Submit the form
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    console.log('✅ Form submitted');
  }

  // Clean up
  await agent.closeAgent();
}

module.exports = { applyToJob };