const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Normalize string keys for matching
function normalize(str) {
  return typeof str === 'string'
    ? str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    : '';
}

async function applyToJob(url, userData) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  // Build normalized map of user data
  const userMap = {};
  for (const key in userData) {
    const norm = normalize(key);
    if (norm) userMap[norm] = userData[key];
  }

  // --- 1) Resume Upload ---
  const resumeSelector = 'input#resume[type="file"]';
  const resumeInput = await page.$(resumeSelector);
  if (resumeInput) {
    const resumePath = path.resolve(__dirname, 'resume.pdf');
    if (!fs.existsSync(resumePath)) {
      throw new Error(`Resume file not found at ${resumePath}`);
    }
    await resumeInput.setInputFiles(resumePath);
    // Dispatch events so the site picks up the new file
    await resumeInput.dispatchEvent('change');
    await resumeInput.dispatchEvent('input');
    // Wait for UI to update
    await page.waitForTimeout(1500);
    console.log('Resume uploaded');
  }

  // --- 2) Fill Other Fields by Label → ID ---
  const labels = await page.$$('form#application-form label');
  for (const lbl of labels) {
    const raw = await lbl.innerText();
    const label = raw.replace('*', '').trim();
    const normLabel = normalize(label);
    if (!normLabel) continue;

    const forId = await lbl.getAttribute('for');
    if (!forId) continue;

    const field = await page.$(`#${forId}`);
    if (!field) continue;

    // Determine value from userMap (exact or partial match)
    let value = userMap[normLabel] || '';
    if (!value) {
      const match = Object.keys(userMap).find(k => normLabel.includes(k) || k.includes(normLabel));
      if (match) value = userMap[match];
    }
    if (!value) continue;

    const tag = await field.evaluate(e => e.tagName.toLowerCase());
    const type = (await field.getAttribute('type') || '').toLowerCase();
    const role = await field.getAttribute('role');

    console.log(`Filling "${label}" (${tag}/${type}/${role}) with "${value}"`);

    if (tag === 'textarea') {
      await field.fill(value);

    } else if (tag === 'input') {
      if (['text','email','tel','number','url','search','password','date'].includes(type)) {
        if (role === 'combobox') {
          await field.click({ force: true });
          await field.type(value);
          await page.waitForTimeout(1500);
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        } else {
          await field.fill(value);
        }
      } else if (type === 'checkbox') {
        const truthy = ['true','yes','1','on'];
        if (truthy.includes(String(value).toLowerCase())) {
          await field.check({ force: true });
        }
      }

    } else if (tag === 'select') {
      try {
        await field.selectOption({ label: value });
      } catch {
        await field.click();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
    }
  }

  // console.log('Form fill complete. Closing browser.');
  // await browser.close();
}

module.exports = { applyToJob };
