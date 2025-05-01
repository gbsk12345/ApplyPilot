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
 * @param {string} url
 * @param {Object} userData
 */
async function applyToLeverJob(url, userData) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini'
  });
  const agent = new HyperAgent({ llm });
  const page = await agent.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Build a normalized map of userData
  const userMap = {};
  for (const key in userData) {
    const norm = normalize(key);
    if (norm) userMap[norm] = userData[key];
  }

  const resumeSelector = 'input[data-qa="input-resume"], input.invisible-resume-upload';
  const resumeInput = await page.$(resumeSelector);
  if (resumeInput) {
    const resumePath = path.resolve(__dirname, 'resume.pdf');
    if (!fs.existsSync(resumePath)) {
      throw new Error(`Resume file not found: ${resumePath}`);
    }
    try {
        await resumeInput.setInputFiles(resumePath);
        await resumeInput.dispatchEvent('change');
        await resumeInput.dispatchEvent('input');
        await page.waitForTimeout(2500);
        console.log('✅ Resume uploaded');
    } catch (err) {
        console.error("❌ Failed to upload resume:", err.message);
    }
  } else {
      console.warn("⚠️ Resume input field not found with selector:", resumeSelector);
  }

  const questions = await page.$$('li.application-question');
  const unfilled = [];

  for (const question of questions) {
    let labelElement = await question.$('label > .application-label, div.application-label:not(.multiple-select):not(.checkbox)'); // More specific label selectors
    let rawLabel = labelElement ? await labelElement.innerText() : '';
    if (!rawLabel) {
        labelElement = await question.$('.application-label .text');
        rawLabel = labelElement ? await labelElement.innerText() : '';
    }
    if (!rawLabel) continue;

    const labelText = rawLabel.replace(/✱|\*/g, '').trim();
    const normLabel = normalize(labelText);
    if (!normLabel) continue;

    let field = await question.$('.application-field input, .application-field textarea, .application-field select');
    let fieldType = 'standard';

    const isRadioGroup = await question.$('.application-field ul[data-qa="multiple-choice"]');
    const isCheckboxGroup = await question.$('.application-field ul[data-qa*="checkboxes"]'); // Use contains selector for variations

    if (isRadioGroup) fieldType = 'radio';
    else if (isCheckboxGroup) fieldType = 'checkbox';
    else if (!field) {
      console.warn(`Field not found for label (will try LLM): "${labelText}" (Normalized: ${normLabel})`);
      unfilled.push({ labelText, normLabel });
      continue;
    }

    let value = userMap[normLabel] || '';
    if (!value) {
      const key = Object.keys(userMap).find(k => k && normLabel && (normLabel.includes(k) || k.includes(normLabel)));
      if (key) value = userMap[key];
    }
    if (!value && fieldType === 'standard') {
        console.warn(`Value not found for label (will try LLM): "${labelText}" (Normalized: ${normLabel})`);
        unfilled.push({ labelText, normLabel });
        continue;
    }
    if (!value && (fieldType === 'radio' || fieldType === 'checkbox')) {
         console.log(`Skipping radio/checkbox group (no value provided): "${labelText}"`);
         continue;
    }


    console.log(`Attempting to fill: "${labelText}" → ${value} (Type: ${fieldType})`);

    try {
        if (fieldType === 'radio') {
            const options = await question.$$('.application-field ul[data-qa="multiple-choice"] li label');
            let filled = false;
            for (const optionLabel of options) {
                const radioInput = await optionLabel.$('input[type="radio"]');
                const spanElement = await optionLabel.$('.application-answer-alternative');
                const optionText = spanElement ? await spanElement.innerText() : '';
                if (radioInput && optionText && normalize(optionText) === normalize(value)) {
                    await radioInput.check({ force: true });
                    console.log(`   Checked radio: ${optionText}`);
                    filled = true;
                    break;
                }
            }
             if (!filled) {
                 console.warn(`   Could not find matching radio option for "${value}" in group "${labelText}"`);
                 unfilled.push({ labelText, normLabel }); // Add to LLM fallback if match failed
             }

        } else if (fieldType === 'checkbox') {
            const valuesToSelect = Array.isArray(value) ? value.map(normalize) : [normalize(value)];
            const options = await question.$$('.application-field ul[data-qa*="checkboxes"] li label');
            let filledCount = 0;

            for (const optionLabel of options) {
                const checkboxInput = await optionLabel.$('input[type="checkbox"]');
                let optionText = '';
                 const isPronoun = await checkboxInput?.getAttribute('name') === 'pronouns';
                 if (isPronoun) {
                    optionText = await checkboxInput.getAttribute('value') || '';
                 } else {
                    const spanElement = await optionLabel.$('.application-answer-alternative');
                    optionText = spanElement ? await spanElement.innerText() : '';
                 }

                if (checkboxInput && optionText && valuesToSelect.includes(normalize(optionText))) {
                    await checkboxInput.check({ force: true });
                    console.log(`   Checked checkbox: ${optionText}`);
                    filledCount++;
                }
            }
            if (filledCount === 0 && valuesToSelect.length > 0 && valuesToSelect[0] !== '') {
                console.warn(`   Could not find any matching checkbox options for "${value}" in group "${labelText}"`);
                 unfilled.push({ labelText, normLabel });
            }

        } else if (field) {
            const tag = await field.evaluate(el => el.tagName.toLowerCase());
            const type = (await field.getAttribute('type') || '').toLowerCase();
            const dataQa = await field.getAttribute('data-qa');
            const isLocationInput = dataQa === 'location-input';

            if (tag === 'textarea' || (tag === 'input' && ['text', 'email', 'tel', 'number', 'url', 'search', 'password', 'date'].includes(type))) {
                if (isLocationInput) {
                    console.log('   Handling as location combobox...');
                    await field.click({ force: true });
                    await field.type(value, { delay: 50 });
                    await page.waitForTimeout(2500);
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(500);
                } else {
                    await field.fill(value);
                }
            } else if (tag === 'select') {
                 try {
                    await field.selectOption({ label: value });
                 } catch {
                    try {
                         await field.selectOption({ value: value });
                    } catch (e) {
                        console.warn(`   Could not select option "${value}" for select field "${labelText}". Error: ${e.message}. Adding to LLM fallback.`);
                        unfilled.push({ labelText, normLabel });
                    }
                 }
            } else {
                console.warn(`   Unhandled standard field type (Tag: ${tag}, Type: ${type}) for label "${labelText}". Adding to LLM fallback.`);
                unfilled.push({ labelText, normLabel });
            }
        } else {
            console.error(`   Logic error: No field or type determined for label "${labelText}"`);
            unfilled.push({ labelText, normLabel });
        }
        await page.waitForTimeout(300);
    } catch (err) {
        console.error(`❌ Error filling field "${labelText}": ${err.message}`);
        unfilled.push({ labelText, normLabel });
    }
  }
  if (unfilled.length) {
    console.log(`\n--- LLM Fallback for ${unfilled.length} fields ---`);
    console.log(unfilled.map(u => `  - ${u.labelText} (Normalized: ${u.normLabel})`));

    let prompt = `Please fill the following remaining fields on this job application form. Use the provided values precisely.
For text inputs, just type the value.
For dropdowns, comboboxes (like location), or fields requiring selection after typing: type the value, wait for 1.5 seconds, press the Down Arrow key once, then press Enter.
For radio button groups: find the option that exactly matches the value and click it.
For checkbox groups: find the option(s) that exactly match the value(s) and check them. If the value is "Prefer not to say", select that option if available.

Fields to fill:\n`;

    for (const { labelText, normLabel } of unfilled) {
        const fillValue = userMap[normLabel] || '';
        if (fillValue) {
            prompt += `- "${labelText}": ${fillValue}\n`;
        }
    }
    if (prompt.split('\n').length > 6) {
         console.log("Sending prompt to LLM:\n", prompt);
        try {
            await page.ai(prompt);
            console.log("✅ LLM fallback executed.");
        } catch (aiError) {
            console.error("❌ LLM fallback failed:", aiError.message);
        }
    } else {
         console.log("No fields with values to send to LLM fallback.");
    }
  } else {
      console.log("\n✅ No fields required LLM fallback.");
  }

  console.log("\n--- Attempting Submission ---");
  const submitBtnSelector = 'button[data-qa="btn-submit"]';
  const submitBtn = await page.$(submitBtnSelector);

//   if (submitBtn) {
//     console.log("⚠️ Found submit button. Clicking it will likely trigger an hCaptcha challenge which this script CANNOT solve automatically.");
//     console.log("⚠️ If running interactively, be prepared to solve the CAPTCHA in the browser window shortly after clicking.");

//     await submitBtn.click();
//     console.log("✅ Submit button clicked. Waiting for potential CAPTCHA or confirmation...");
//     await page.waitForTimeout(15000);
//     const successIndicator = await page.$('text=/Application submitted|Thank you for applying/i'); // Example
//      if (successIndicator) {
//          console.log("✅✅ Possible submission success detected!");
//      } else {
//          console.warn("⚠️ Submission status unclear after 15 seconds. Manual check recommended. CAPTCHA likely interfered.");
//      }

//   } else {
//     console.error("❌ Submit button not found with selector:", submitBtnSelector);
//   }

//   console.log("Closing agent.");
//   await agent.closeAgent();
}

module.exports = { applyToLeverJob };