try { require('@img/sharp-libvips-darwin-arm64'); } catch {}
require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');
const { HyperAgent } = require('@hyperbrowser/agent');
const path = require('path');
const fs = require('fs');

function normalize(str) {
  return typeof str === 'string'
    ? str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    : '';
}

const randomDelay = (page, min, max) =>
  page.waitForTimeout(Math.floor(Math.random() * (max - min + 1)) + min);

async function applyToSmartRecruiters(url, userData) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');

  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini'
  });
  const agent = new HyperAgent({ llm });
  const page = await agent.newPage();

  // 1) load
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  let frame = page;
  const iframe = await page.$('iframe[src*="smartrecruiters.com"]');
  if (iframe) {
    const cf = await iframe.contentFrame();
    if (cf) frame = cf;
  }

  // 2) wait for page 1
  await frame.waitForSelector(
    'spl-typography-title[data-test="section-title"]',
    { state: 'visible', timeout: 30000 }
  );
  await randomDelay(frame, 500, 1000);

  // 3) upload resume if provided
  if (userData.resume) {
    const resumePath =
      typeof userData.resume === 'string' &&
      fs.existsSync(path.resolve(__dirname, userData.resume))
        ? path.resolve(__dirname, userData.resume)
        : path.resolve(__dirname, 'resume.pdf');
    const fileInput = await frame.$(
      'spl-dropzone[data-test="resume-upload"] input[type="file"], oc-apply-with-resume input[type="file"]'
    );
    if (fileInput) {
      await fileInput.setInputFiles(resumePath);
      await randomDelay(frame, 500, 1000);
    }
  }

  // 4) fill out page 1 fields
  const page1Map = {
    firstName: '#first-name-input',
    lastName: '#last-name-input',
    email: '#email-input',
    emailConfirmation: '#confirm-email-input',
    location: '#spl-form-element_10',        // City
    phone: '#spl-form-element_5',            // Phone number
    linkedIn: '#linkedin-input',
    facebook: '#facebook-input',
    twitter: '#twitter-input',
    website: '#website-input',
    message: '#hiring-manager-message-input' // Message to the Hiring Team
  };

  for (const key of Object.keys(page1Map)) {
    // try both normalized labels and direct key
    const rawVal =
      userData[key] ||
      userData[normalize(key)] ||
      userData[normalize(frame.locator(page1Map[key]).getAttribute('label') || '')];
    if (!rawVal) continue;
    const el = await frame.$(page1Map[key]);
    if (el) {
      await el.fill(String(rawVal));
      await randomDelay(frame, 200, 400);
    }
  }

  // 5) click Next → page 2
  await frame.click('oc-button[data-test="footer-next"] spl-button');
  await frame.waitForSelector('sr-screening-questions-form', {
    state: 'visible',
    timeout: 30000
  });
  await randomDelay(frame, 500, 1000);

  // 6) fill all screening questions
  const questions = await frame.$$(
    'sr-screening-questions-form .form-section--clean > *:not(h2)'
  );
  const unfilled = [];

  for (const q of questions) {
    // get question label
    const labEl = await q.$('h3, h4, label, .form-label');
    const label = labEl ? (await labEl.innerText()).trim() : '';
    const norm = normalize(label);

    // pick up answer from either userData.screening or top‐level
    let answer;
    if (userData.screening) {
      answer = userData.screening[norm] || userData.screening[label];
    }
    if (answer == null) {
      answer = userData[norm] || userData[label];
    }
    if (answer == null) {
      unfilled.push(label);
      continue;
    }

    // text / number / textarea
    const textInput = await q.$('input[type="text"], input[type="number"], textarea');
    if (textInput) {
      await textInput.fill(String(answer));
      continue;
    }

    // dropdown
    const sel = await q.$('select');
    if (sel) {
      await sel
        .selectOption({ label: String(answer) })
        .catch(() => sel.selectOption({ value: String(answer) }));
      continue;
    }

    // radios
    const radios = await q.$$('input[type="radio"]');
    if (radios.length) {
      for (const r of radios) {
        const val = await r.getAttribute('value');
        if (String(answer).toLowerCase() === String(val).toLowerCase()) {
          await r.check({ force: true });
          break;
        }
        // fallback match on radio label text
        const id = await r.getAttribute('id');
        if (id) {
          const lab = await q.$(`label[for="${id}"]`);
          if (lab) {
            const txt = await lab.innerText();
            if (normalize(txt) === normalize(String(answer))) {
              await r.check({ force: true });
              break;
            }
          }
        }
      }
      continue;
    }

    // checkbox
    const cb = await q.$('input[type="checkbox"]');
    if (cb) {
      if (['true', 'yes', '1', 'on'].includes(String(answer).toLowerCase())) {
        await cb.check({ force: true });
      } else {
        await cb.uncheck({ force: true });
      }
      continue;
    }
  }

  if (unfilled.length) {
    console.warn('Unfilled screening questions:', unfilled);
  }

  // 7) stop here (we’re not submitting yet)
  await agent.closeAgent();
}

module.exports = { applyToSmartRecruiters };

