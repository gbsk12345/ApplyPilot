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

// --- NEW: Keyword Aliasing Map ---
// This map contains common variations for standard application fields.
// The key is our standard, internal name, and the value is an array of aliases.
const fieldAliases = {
  'name': ['first and last name', 'full name'],
  'linkedin profile': ['linkedin url', 'linkedin', 'professional profile url'],
  'website': ['website url', 'personal website', 'portfolio url', 'portfolio'],
  'github profile': ['github url', 'github'],
  'phone': ['phone number', 'mobile phone'],
  'location': ['current location', 'city'],
  'resume': ['resume', 'cv', 'resume cv'],
  'cover letter': ['cover letter', 'cover letter optional'],
  'sponsorship': ['require sponsorship', 'visa sponsorship', 'require visa sponsorship'],
  'authorized to work': ['work authorization', 'eligible to work']
};

// --- NEW: Helper function to find the standard key using the alias map ---
function findDataKeyByAlias(normalizedLabel) {
    for (const standardKey in fieldAliases) {
        if (fieldAliases[standardKey].includes(normalizedLabel)) {
            return standardKey;
        }
    }
    return null; // Return null if no alias matches
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

  const llm = new ChatOpenAI({ openAIApiKey: process.env.OPENAI_API_KEY, modelName: 'gpt-4o-mini' });
  const agent = new HyperAgent({ llm });
  const page = await agent.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const userMap = {};
  for (const key in userData) {
    const norm = normalize(key);
    if (norm) userMap[norm] = userData[key];
  }
  if (userMap['first name'] && userMap['last name']) {
      const fullName = `${userMap['first name']} ${userMap['last name']}`;
      userMap['name'] = fullName;
  }

  const resumePath = path.resolve(__dirname, 'resume.pdf');
  if (!fs.existsSync(resumePath)) {
    throw new Error(`Resume file not found at: ${resumePath}`);
  }

  const resumeContainer = await page.$('div[class*="_fieldEntry_"]:has(label:text-matches("Resume", "i"))');
  if (resumeContainer) {
    const uploadButton = await resumeContainer.$('button:has(span:text-is("Upload File"))');
    if (uploadButton) {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await uploadButton.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(resumePath);
      console.log('✅ Resume uploaded successfully.');
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ Could not find the "Upload File" button inside the resume container.');
    }
  } else {
    console.log('⚠️ Could not find the resume upload container, skipping resume upload.');
  }

  const fieldContainers = await page.$$('div[class*="_fieldEntry_"]');
  const unfilled = [];

  for (const container of fieldContainers) {
    const labelEl = await container.$('label[class*="_label_"]');
    if (!labelEl) continue;

    const rawLabel = await labelEl.innerText();
    const labelText = rawLabel.replace('*', '').trim();
    const normLabel = normalize(labelText);
    if (!normLabel || normLabel.includes('resume')) continue;

    // --- MODIFIED: Value lookup logic with aliasing ---
    let value = '';
    // 1. Try a direct match with the normalized label.
    if (userMap[normLabel]) {
        value = userMap[normLabel];
    } else {
        // 2. If no direct match, try finding a standard key via our alias map.
        const standardKey = findDataKeyByAlias(normLabel);
        if (standardKey && userMap[standardKey]) {
            value = userMap[standardKey];
        }
    }

    if (!value) {
      unfilled.push({ labelText, normLabel });
      continue;
    }
    
    console.log(`Attempting to fill: "${labelText}" with value: "${value}"`);

    const input = await container.$('input[type="text"], input[type="email"], input[type="tel"], textarea');
    if (input) {
      await input.fill(String(value));
      await page.waitForTimeout(200);
      continue;
    }

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

    const radioGroup = await container.$('fieldset');
    if (radioGroup) {
      const optionLabel = await radioGroup.$(`label:text-matches("${value}", "i")`);
      if (optionLabel) {
        await optionLabel.click();
        await page.waitForTimeout(200);
        continue;
      }
    }

    const yesNoGroup = await container.$('div[class*="_yesno_"]');
    if (yesNoGroup) {
      const answer = String(value).toLowerCase();
      const buttonSelector = answer.includes('yes') ? 'button:text-is("Yes")' : 'button:text-is("No")';
      const buttonElement = await yesNoGroup.$(buttonSelector);
      if (buttonElement) {
        await buttonElement.click();
        await page.waitForTimeout(200);
        continue;
      }
    }

    unfilled.push({ labelText, normLabel });
  }

//   if (unfilled.length > 0) {
//     console.log('⚠️ Using LLM fallback for the following fields:', unfilled.map(u => u.labelText));
//     let prompt = 'Please fill the following remaining fields on this application form with the given values. For dropdowns or comboboxes, type the value, wait 1.5 seconds, then press the down arrow key and the enter key to select the first suggestion. For radio buttons or Yes/No questions, click the option that best matches the value.\n';
//     for (const { labelText, normLabel } of unfilled) {
//       // For the LLM, we still try to find the best possible value, even if it wasn't a perfect match
//       const fillValue = userMap[normLabel] || userMap[findDataKeyByAlias(normLabel)] || 'Not applicable';
//       prompt += `- For the question "${labelText}", the answer is: "${fillValue}"\n`;
//     }
//     await page.ai(prompt);
//   }

  // --- Submit and Cleanup ---
  console.log('Application process finished.');
  // await agent.close();
}

module.exports = { applyToAshbyJob };
