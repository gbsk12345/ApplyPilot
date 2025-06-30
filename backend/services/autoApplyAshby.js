// services/applyToAshbyJob.js

// Load Apple Silicon libvips for Sharp (used by HyperAgent for screenshots)
try { require('@img/sharp-libvips-darwin-arm64'); } catch {}
// Load environment variables
require('dotenv').config();

const { ChatOpenAI } = require('@langchain/openai');
const { HyperAgent } = require('@hyperbrowser/agent');
const path = require('path');
const fs = require('fs');

// Helper function to normalize strings for matching labels and keys
function normalize(str) {
  return typeof str === 'string'
    ? str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    : '';
}

/**
 * applyToAshbyJob
 * Automates filling out job application forms on the Ashby platform.
 * This script is generalized to handle variations in Ashby's form structure.
 * @param {string} url - The job application URL from an Ashby board.
 * @param {Object} userData - A map of field labels to user values for filling the form.
 */
async function applyToAshbyJob(url, userData) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  // Initialize the LLM and the HyperAgent for browser automation
  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini'
  });
  const agent = new HyperAgent({ llm });

  // Open a new page and navigate to the job application URL
  const page = await agent.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Create a normalized map of the user's data for easy lookups
  const userMap = {};
  for (const key in userData) {
    const norm = normalize(key);
    if (norm) userMap[norm] = userData[key];
  }
  // Combine first and last name for single "Full Name" or "Name" fields
  if (userMap['first name'] && userMap['last name']) {
      const fullName = `${userMap['first name']} ${userMap['last name']}`;
      userMap['first and last name'] = fullName;
      userMap['name'] = fullName; // Cover both "Name" and "First and Last Name"
  }


  // --- Automation Step 1: Upload Resume ---
  // The resume input is consistently identified by a system-level ID.
  const resumeInput = await page.$('input[type="file"][id="_systemfield_resume"]');
  if (resumeInput) {
    const resumePath = path.resolve(__dirname, 'resume.pdf');
    if (!fs.existsSync(resumePath)) {
      throw new Error(`Resume file not found at: ${resumePath}`);
    }
    await resumeInput.setInputFiles(resumePath);
    console.log('✅ Resume uploaded successfully.');
    await page.waitForTimeout(1500);
  }

  // --- Automation Step 2: Fill Form Fields with Playwright ---
  // Generalize selectors by looking for partial class names that denote function.
  const fieldContainers = await page.$$('div[class*="_fieldEntry_"]');
  const unfilled = [];

  for (const container of fieldContainers) {
    const labelEl = await container.$('label[class*="_label_"]');
    if (!labelEl) continue;

    const rawLabel = await labelEl.innerText();
    const labelText = rawLabel.replace('*', '').trim();
    const normLabel = normalize(labelText);
    if (!normLabel) continue;

    // Find the corresponding value from the user's data
    let value = userMap[normLabel] || '';
    if (!value) {
      const key = Object.keys(userMap).find(k => normLabel.includes(k) || k.includes(normLabel));
      if (key) value = userMap[key];
    }
    if (!value) {
      unfilled.push({ labelText, normLabel });
      continue;
    }
    
    console.log(`Attempting to fill: "${labelText}" with value: "${value}"`);

    // --- Handle different types of input fields using generalized selectors ---

    // Standard text, email, tel inputs
    const input = await container.$('input[type="text"], input[type="email"], input[type="tel"], textarea');
    if (input) {
      await input.fill(String(value));
      await page.waitForTimeout(200);
      continue;
    }

    // Location Combobox
    const combobox = await container.$('input[role="combobox"]');
    if (combobox) {
        await combobox.click({ force: true });
        await combobox.fill(String(value));
        await page.waitForTimeout(1500);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
        continue;
    }

    // Radio button groups
    const radioGroup = await container.$('fieldset');
    if (radioGroup) {
      const optionLabel = await radioGroup.$(`label:text-matches("${value}", "i")`);
      if (optionLabel) {
        await optionLabel.click();
        await page.waitForTimeout(200);
        continue;
      }
    }

    // Yes/No button groups
    const yesNoGroup = await container.$('div[class*="_yesno_"]');
    if (yesNoGroup) {
      const answer = String(value).toLowerCase();
      const buttonToClick = answer.includes('yes') ? 'button:text-is("Yes")' : 'button:text-is("No")';
      await yesNoGroup.click(buttonToClick);
      await page.waitForTimeout(200);
      continue;
    }

    unfilled.push({ labelText, normLabel });
  }

  // --- Automation Step 3: LLM Fallback for Unfilled Fields ---
  if (unfilled.length > 0) {
    console.log('⚠️ Using LLM fallback for the following fields:', unfilled.map(u => u.labelText));
    let prompt = 'Please fill the following remaining fields on this application form with the given values. For dropdowns or comboboxes, type the value, wait 1.5 seconds, then press the down arrow key and the enter key to select the first suggestion. For radio buttons or Yes/No questions, click the option that best matches the value.\n';
    for (const { labelText, normLabel } of unfilled) {
      const fillValue = userMap[normLabel] || 'Not applicable';
      prompt += `- For the question "${labelText}", the answer is: "${fillValue}"\n`;
    }
    await page.ai(prompt);
  }

  // --- Automation Step 4: Submit the Form ---
  // Uncomment to enable submission. The submit button class is also generalized.
  /*
  const submitButton = await page.$('button[class*="_submitButton_"]');
  if (submitButton) {
    await submitButton.click();
    console.log('✅ Form submitted successfully.');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('Navigated to confirmation page:', page.url());
  } else {
    console.error('Could not find the submit button.');
  }
  */

  // --- Cleanup ---
  // await agent.close();
  console.log('Application process finished.');
}

module.exports = { applyToAshbyJob };
