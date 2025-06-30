// services/autoApply.js
try {
  if (process.platform === 'darwin' && process.arch === 'arm64') {
    require('@img/sharp-libvips-darwin-arm64');
  } else if (process.platform === 'linux' && process.arch === 'x64') {
    // require('@img/sharp-libvips-linux-x64'); // Example
  }
} catch (e) {
  // console.warn("Optional Sharp binary not found or not applicable:", e.message);
}
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const { ChatOpenAI } = require('@langchain/openai');
const { HyperAgent } = require('@hyperbrowser/agent');
const path = require('path');
const fs = require('fs');
const Fuzzyset = require('fuzzyset.js');

function normalize(str) {
  return typeof str === 'string'
    ? str.toLowerCase().replace(/[^a-z0-9\s]+/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

const YES_NO_OPTIONS = {
  yes: "Yes",
  no: "No",
  true: "Yes",
  false: "No",
};
const DECLINE_TO_IDENTIFY = "I decline to self-identify";

const DISABILITY_MAP = {
  yes: "Yes, I have a disability (or have previously had one)",
  no: "No, I don’t have a disability",
  decline: DECLINE_TO_IDENTIFY,
  prefer_not_to_say: DECLINE_TO_IDENTIFY,
};
const VETERAN_MAP = {
  not_veteran: "I am not a protected veteran",
  protected_veteran: "I identify as one or more of the classifications of protected veterans",
  other_veteran: "I identify as one or more of the classifications of protected veterans",
  decline: DECLINE_TO_IDENTIFY,
  prefer_not_to_say: DECLINE_TO_IDENTIFY,
};
const HISPANIC_LATINO_MAP = {
  yes: "Yes", // Or "Hispanic or Latino"
  no: "No",   // Or "Not Hispanic or Latino"
  decline: DECLINE_TO_IDENTIFY,
  prefer_not_to_say: DECLINE_TO_IDENTIFY,
};
const RACE_ETHNICITY_OPTIONS = {
  white: "White",
  black_african_american: "Black or African American",
  asian: "Asian",
  native_hawaiian_pacific_islander: "Native Hawaiian or Other Pacific Islander",
  american_indian_alaska_native: "American Indian or Alaska Native",
  two_or_more_races: "Two or More Races",
  decline: DECLINE_TO_IDENTIFY,
  prefer_not_to_say: DECLINE_TO_IDENTIFY,
};
const GENDER_MAP = {
  male: "Male",
  female: "Female",
  non_binary: "Non-Binary",
  nonbinary: "Non-Binary",
  decline: DECLINE_TO_IDENTIFY,
  prefer_not_to_say: DECLINE_TO_IDENTIFY,
};

async function applyToJob(url, userData) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0.1,
  });
  const agent = new HyperAgent({ llm });
  const page = await agent.newPage();
  console.log(`Navigating to job URL: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });

  const userMap = {};

  if (userData.profile) {
    const profile = userData.profile;
    const stringFields = ['first_name', 'middle_name', 'last_name', 'preferred_name', 'email', 'phone', 
                          'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
                          'linkedin_url', 'website_url', 'github_url', 'visa_status', 'desired_salary',
                          'interest_statement', 'additional_info', 'key_skills'];
    stringFields.forEach(key => {
      if (profile[key] !== null && profile[key] !== undefined && String(profile[key]).trim() !== '') {
        userMap[normalize(key)] = String(profile[key]).trim();
      }
    });

    userMap[normalize("full name")] = `${String(profile.first_name || '')} ${String(profile.last_name || '')}`.trim();
    userMap[normalize("legal name")] = userMap[normalize("full name")];
    if (profile.preferred_name) userMap[normalize("preferred name")] = String(profile.preferred_name);
    
    const commonLinkLabels = ["linkedin", "linkedin profile", "linkedin url"];
    commonLinkLabels.forEach(label => { if (profile.linkedin_url) userMap[normalize(label)] = profile.linkedin_url; });
    const commonWebsiteLabels = ["website", "personal website", "portfolio", "website url"];
    commonWebsiteLabels.forEach(label => { if (profile.website_url) userMap[normalize(label)] = profile.website_url; });
    const commonGithubLabels = ["github", "github profile", "github url"];
    commonGithubLabels.forEach(label => { if (profile.github_url) userMap[normalize(label)] = profile.github_url; });
    userMap[normalize('location city')] = String(profile.city || '');

    // Boolean fields & Sponsorship
    const booleanProfileMappings = {
      "authorized to work": profile.authorized_to_work,
      "willing to relocate": profile.willing_to_relocate,
      "require sponsorship": profile.needs_sponsorship,
      "immigration sponsorship": profile.needs_sponsorship,
      "sponsorship": profile.needs_sponsorship,
      "visa sponsorship": profile.needs_sponsorship,
      "do you now or will you in the future require immigration sponsorship": profile.needs_sponsorship, // Generic part of question
      "do you now or will you in the future require immigration sponsorship to work at cloudflare": profile.needs_sponsorship, // More specific
    };
    for (const label in booleanProfileMappings) {
      const value = booleanProfileMappings[label];
      if (value !== null && value !== undefined) {
        userMap[normalize(label)] = value ? YES_NO_OPTIONS.yes : YES_NO_OPTIONS.no;
      }
    }
    
    if (profile.gender) userMap[normalize("gender")] = GENDER_MAP[String(profile.gender).toLowerCase()] || GENDER_MAP.decline;
    if (profile.veteran_status) userMap[normalize("veteran status")] = VETERAN_MAP[String(profile.veteran_status).toLowerCase()] || VETERAN_MAP.decline;
    if (profile.disability_status) {
        userMap[normalize("disability status")] = DISABILITY_MAP[String(profile.disability_status).toLowerCase()] || DISABILITY_MAP.decline;
    }

    if (profile.race) { /* ... same race/ethnicity mapping as before ... */
        const raceVal = String(profile.race).toLowerCase();
        const hispanicLatinoLabelNorm = normalize("are you hispanic or latino");
        if (raceVal === 'hispanic_latino' || raceVal === 'hispanic or latino') {
            userMap[hispanicLatinoLabelNorm] = HISPANIC_LATINO_MAP.yes;
            userMap[normalize("race ethnicity")] = RACE_ETHNICITY_OPTIONS.hispanic_or_latino;
        } else {
            userMap[hispanicLatinoLabelNorm] = HISPANIC_LATINO_MAP.no;
            userMap[normalize("race")] = RACE_ETHNICITY_OPTIONS[raceVal] || RACE_ETHNICITY_OPTIONS.decline;
            userMap[normalize("race ethnicity")] = RACE_ETHNICITY_OPTIONS[raceVal] || RACE_ETHNICITY_OPTIONS.decline;
        }
    } else {
        userMap[normalize("are you hispanic or latino")] = HISPANIC_LATINO_MAP.decline;
        userMap[normalize("race")] = RACE_ETHNICITY_OPTIONS.decline;
        userMap[normalize("race ethnicity")] = RACE_ETHNICITY_OPTIONS.decline;
    }

    const wantsToIncludeLinks = !!(profile.linkedin_url || profile.website_url);
    userMap[normalize("would you like to include your linkedin profile personal website or blog")] = wantsToIncludeLinks ? YES_NO_OPTIONS.yes : YES_NO_OPTIONS.no;
  }

  if (userData.educations && userData.educations.length > 0) { /* ... same education mapping ... */
    const edu = userData.educations[0];
    if(edu.school_name) userMap[normalize("school")] = String(edu.school_name);
    if(edu.degree_level) userMap[normalize("degree")] = String(edu.degree_level);
    if(edu.major) userMap[normalize("major")] = String(edu.major);
    if(edu.graduation_date) userMap[normalize("graduation date")] = String(edu.graduation_date);
  }
  if (userData.experiences && userData.experiences.length > 0) { /* ... same experience mapping ... */
    const exp = userData.experiences[0];
    if(exp.company_name) userMap[normalize("company")] = String(exp.company_name);
    if(exp.job_title) userMap[normalize("title")] = String(exp.job_title);
  }

  let resumePathToUse = null;
  if (userData.profile && userData.profile.resume_storage_path) { /* ... same resume path logic ... */ 
      resumePathToUse = path.resolve(userData.profile.resume_storage_path); 
      if (!fs.existsSync(resumePathToUse)) {
          console.warn(`User resume from profile.resume_storage_path ("${userData.profile.resume_storage_path}") not found at resolved path: "${resumePathToUse}". Trying default.`);
          resumePathToUse = null;
      }
  }
  if (!resumePathToUse) {
      const defaultResumePath = path.resolve(__dirname, 'resume.pdf');
      if (fs.existsSync(defaultResumePath)) {
          resumePathToUse = defaultResumePath;
          console.log('Using default resume.pdf');
      } else {
          console.warn(`Default resume file not found: ${defaultResumePath}.`);
      }
  }
  if (resumePathToUse) {
    userMap[normalize("resume")] = resumePathToUse; userMap[normalize("cv")] = resumePathToUse; userMap[normalize("resume cv")] = resumePathToUse;
  }

  console.log("UserMap snapshot (first 5 keys & resume):", Object.fromEntries(Object.entries(userMap).slice(0,5)), userMap[normalize("resume")] ? `Resume path: ${userMap[normalize("resume")]}` : "No resume in map" );

  // 1) Resume upload
  // ... (Keep your existing robust resume upload logic here using resumePathToUse) ...
  const resumeSelectors = [
    'input[type="file"][id*="resume"]', 'input[type="file"][name*="resume"]', 
    'input[type="file"][aria-label*="resume"]', 'input[type="file"][data-testid*="resume"]',
    'button[aria-controls*="resume"]', 'button[data-automation-id="resumeUploadButton"]'
  ];
  let resumeUploaded = false;
  if (resumePathToUse) {
    for (const selector of resumeSelectors) {
      const resumeInput = await page.$(selector);
      if (resumeInput && await resumeInput.isVisible()) {
        try {
          await resumeInput.setInputFiles(resumePathToUse);
          await page.waitForTimeout(2000); 
          console.log('✅ Resume uploaded');
          resumeUploaded = true;
          break; 
        } catch (e) { console.warn(`Resume upload failed with selector ${selector}: ${e.message}`); }
      }
    }
    if (!resumeUploaded) console.warn('Could not upload resume despite having a path.');
  } else { console.warn('No resume path available. Skipping resume upload.'); }

  // 2) Playwright-first field filling
  const labels = await page.$$('form[id*="application"] label, form[aria-label*="application"] label, label[for]');
  const unfilled = [];
  const userMapKeysForFuzzy = Object.keys(userMap);
  const fuzzyMatcher = userMapKeysForFuzzy.length > 0 ? Fuzzyset(userMapKeysForFuzzy) : null;

  for (const lbl of labels) {
    // ... (Your existing label processing, field finding, value determination (exact + fuzzy),
    //      visibility/disabled checks, and type-specific filling logic (input, select, checkbox)
    //      should remain largely the same here. Ensure valueString is always a string for .fill()) ...
    // --- Start of one iteration of the loop (copied & adapted from previous full response) ---
    const rawLabelText = await lbl.innerText().catch(() => '');
    const labelText = rawLabelText.replace(/\*/g, '').trim();
    const normLabel = normalize(labelText);
    if (!normLabel) continue;

    const forId = await lbl.getAttribute('for');
    let field = forId ? await page.$(`[id="${forId}"], [name="${forId}"]`) : null;
    if (!field) {
        const handle = await lbl.evaluateHandle(el => {
            let current = el; let searchCount = 0;
            while (current && searchCount < 3) {
                const directField = current.querySelector('input:not([type="hidden"]):not([type="submit"]), textarea, select, [role="combobox"]');
                if (directField) return directField;
                if (current.parentElement?.matches('label')) current = current.parentElement; else break; 
                searchCount++;
            }
            let parent = el.parentElement; searchCount = 0;
            while(parent && searchCount < 3) {
                const siblingField = parent.querySelector('input:not([type="hidden"]):not([type="submit"]), textarea, select, [role="combobox"]');
                if (siblingField) return siblingField;
                if(parent.nextElementSibling) {
                    const nextSiblingField = parent.nextElementSibling.querySelector('input:not([type="hidden"]):not([type="submit"]), textarea, select, [role="combobox"]');
                    if (nextSiblingField) return nextSiblingField;
                }
                parent = parent.parentElement; searchCount++;
            } return null;
        }).catch(() => null);
        field = handle && handle.asElement();
    }

    if (!field) {
      unfilled.push({ labelText, normLabel, reason: "Field DOM element not found" });
      continue;
    }

    let valueToFill = userMap[normLabel];
    if ((valueToFill === undefined || String(valueToFill).trim() === '') && fuzzyMatcher) {
      const fuzzyMatchResults = fuzzyMatcher.get(normLabel);
      if (fuzzyMatchResults && fuzzyMatchResults[0] && fuzzyMatchResults[0][0] > 0.70) {
        const matchedKeyFromUserMap = fuzzyMatchResults[0][1];
        valueToFill = userMap[matchedKeyFromUserMap];
        console.log(`Fuzzy match for label "${labelText}" (Normalized: "${normLabel}"): used userMap key "${matchedKeyFromUserMap}" -> value "${valueToFill}"`);
      }
    }

    if ((normLabel === 'resume' || normLabel === 'cv' || normLabel === 'resume cv') && resumeUploaded) continue;
    if ((normLabel === 'resume' || normLabel === 'cv' || normLabel === 'resume cv') && !resumePathToUse) continue;

    if (valueToFill === undefined || String(valueToFill).trim() === '') {
      unfilled.push({ labelText, normLabel, reason: "Value not found in userMap" });
      continue;
    }
    
    const valueString = String(valueToFill);

    const isVisible = await field.isVisible();
    const isDisabled = await field.isDisabled();
    if (!isVisible || isDisabled) {
        unfilled.push({ labelText, normLabel, reason: "Field not visible or disabled" });
        continue;
    }
    
    console.log(`Attempting to fill "${labelText}" (Norm: "${normLabel}") with value → "${valueString.substring(0,50)}${valueString.length > 50 ? '...' : ''}"`);

    try {
      const tag = await field.evaluate(el => el.tagName.toLowerCase());
      let type = (await field.getAttribute('type') || '').toLowerCase();
      if (tag === 'input' && !type && await field.getAttribute('aria-role') !== 'combobox' && await field.getAttribute('role') !== 'combobox') type = 'text';
      const role = await field.getAttribute('role');

      if (tag === 'textarea' || (tag === 'input' && ['text','email','tel','number','url','search','password','date', 'month'].includes(type))) {
        if (role === 'combobox') { 
          await field.click({ force: true, timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(300);
          await field.fill(valueString, { timeout: 5000 });
          await page.waitForTimeout(1500);
          await page.keyboard.press('ArrowDown').catch(() => console.warn(`ArrowDown failed on combobox: ${labelText}`));
          await page.keyboard.press('Enter').catch(() => console.warn(`Enter failed on combobox: ${labelText}`));
        } else { await field.fill(valueString, { timeout: 5000 }); }
      } else if (tag === 'select') { 
        try { await field.selectOption({ label: valueString }, { timeout: 3000 }); }
        catch {
            try { await field.selectOption({ value: valueString }, { timeout: 3000 }); }
            catch (e) {
                console.warn(`Could not select option "${valueString}" for "${labelText}". Pushing to unfilled.`);
                unfilled.push({ labelText, normLabel, reason: `Failed to select option: ${valueString}` });
            }
        }
      } else if (tag === 'input' && type === 'checkbox') { 
        const shouldBeChecked = ['true','yes','1','on'].includes(valueString.toLowerCase());
        const isCurrentlyChecked = await field.isChecked();
        if (shouldBeChecked && !isCurrentlyChecked) { await field.check({ force: true, timeout: 5000 }); }
        else if (!shouldBeChecked && isCurrentlyChecked) { await field.uncheck({ force: true, timeout: 5000 }); }
      } else { unfilled.push({ labelText, normLabel, reason: `Unhandled field: tag=${tag}, type=${type}, role=${role}` });}
      await page.waitForTimeout(400);
    } catch (fillError) { 
      console.error(`Error filling field "${labelText}" with value "${valueString}": ${fillError.message.split('\n')[0]}`);
      unfilled.push({ labelText, normLabel, reason: `Error during fill: ${fillError.message.split('\n')[0]}` });
    }
    // --- End of one iteration of the loop ---
  }


  // --- REVISED LLM FALLBACK SECTION ---
  if (unfilled.length > 0) {
    // Filter out fields that Playwright couldn't find or were unusable,
    // as LLM can't magically fix those DOM issues.
    const actionableUnfilledFields = unfilled.filter(u => 
        u.reason !== "Field DOM element not found" &&
        u.reason !== "Field not visible or disabled"
    );

    if (actionableUnfilledFields.length > 0) {
        console.log('--- LLM Fallback Initiated ---');
        const unfilledFieldDetailsForLLM = actionableUnfilledFields.map(u => 
            `- Field labeled: "${u.labelText}" (Normalized as: "${u.normLabel}", Script reason: ${u.reason})`
        ).join('\n');

        const userDataStringForLLM = Object.entries(userMap)
            .filter(([key, value]) => {
                // Exclude file paths and very long text that might clutter the prompt or be unsuitable for direct filling by LLM
                if (key === normalize("resume") || key === normalize("cv")) return false;
                if (typeof value === 'string' && value.length > 200) return false; // Example length limit
                return value !== null && value !== undefined && String(value).trim() !== '';
            })
            .map(([key, value]) => `- ${key}: "${String(value)}"`)
            .join('\n');

        let prompt = `You are an AI assistant helping to complete a job application form on the webpage: ${page.url()}.
An automated script attempted to fill the form but could not complete the following fields. Your task is to use the provided User Data to intelligently fill these remaining fields.

**User Data (Normalized Key: Value):**
${userDataStringForLLM}

**Remaining Form Fields on the Page to Attempt Filling (prioritize these):**
${unfilledFieldDetailsForLLM}

**Instructions for Filling:**
1. For each field in "Remaining Form Fields", analyze its label.
2. Consult the "User Data Available" to find the most relevant information for that field.
3. For standard text inputs or textareas: Directly type the determined value.
4. For dropdowns, select boxes, or comboboxes: You must type the exact visible text of the desired option (e.g., "Yes", "No", "Male", "Non-Binary", "I decline to self-identify"). After typing, wait 1.5 seconds for filtering, then press the ArrowDown key once to highlight, then press the Enter key.
5. For checkboxes: If User Data indicates "yes" or "true", check the box. If "no" or "false", ensure it's unchecked.
6. If you cannot find a confident or appropriate value in the User Data for a specific field, clearly state "Cannot determine value for field '[label name]'" and DO NOT attempt to fill it. Do not invent information.
7. Focus only on the fields listed under "Remaining Form Fields".
8. After attempting all listed fields, respond with "LLM fallback attempts complete."

Proceed to fill the form based on these instructions.`;

        try {
            console.log(`Sending ${actionableUnfilledFields.length} field(s) to LLM for fallback processing.`);
            // For very detailed debugging: console.debug("LLM Fallback Prompt:\n", prompt);
            await page.ai(prompt, { timeout: 180000 }); // 3 minutes
            console.log("✅ LLM fallback attempt finished by AI.");
        } catch (aiError) {
            console.error("Error during LLM fallback operation:", aiError);
        }
    } else {
        console.log("No actionable fields left for LLM fallback (e.g., all were 'field not found' or 'not visible').");
    }
  } else {
    console.log("No fields were left for LLM fallback; Playwright script handled all identified fields or found no values.");
  }
  // --- END OF REVISED LLM FALLBACK ---
  
  const finalScreenshotPath = path.resolve(__dirname, `app_final_state_${Date.now()}.png`);
  await page.screenshot({ path: finalScreenshotPath, fullPage: true });
  console.log(`✅ Final form state screenshot: ${finalScreenshotPath}`);

  // 4) Submit the form (Uncommented and using robust selectors)
  const submitSelectors = [ /* ... same robust selectors as your provided code ... */ 
    'button[type="submit"]:not([disabled])', 'input[type="submit"]:not([disabled])',
    'button[id*="submit"]:not([disabled])', 'button[data-testid*="submit"]:not([disabled])',
    'button[class*="submit"]:not([disabled])', '[role="button"][aria-label*="Submit Application"]:not([aria-disabled="true"])',
    '[role="button"]:has-text(/^Submit Application$/i):not([aria-disabled="true"])',
    '[role="button"]:has-text(/^Submit$/i):not([aria-disabled="true"])',
    'button:has-text(/^Submit Application$/i):not([disabled])',
    'button:has-text(/^Next$/i):not([disabled])', 
    'button:has-text(/^Continue$/i):not([disabled])',
    'button:has-text(/^Review Application$/i):not([disabled])',
    'button:has-text(/^Submit$/i):not([disabled])'
  ];
  let submitBtnFoundAndClicked = false;
  console.log('Attempting to find and click submit button...');
  for (const selector of submitSelectors) {
    try {
        const submitButtons = await page.locator(selector).all();
        for (const submitBtn of submitButtons) {
            if (await submitBtn.isVisible({timeout: 2000}) && await submitBtn.isEnabled({timeout: 2000})) {
                const btnText = (await submitBtn.innerText({timeout:1000}).catch(()=>'')) || (await submitBtn.getAttribute('aria-label',{timeout:1000}).catch(()=>'')) || '';
                console.log(`Found potential submit button with selector: ${selector} (Text: "${btnText.trim().substring(0,30)}")`);
                await submitBtn.scrollIntoViewIfNeeded();
                await page.waitForTimeout(500); 
                await submitBtn.click({ timeout: 15000 }); 
                console.log('✅ Form submission button clicked.');
                try {
                    // Wait for either a navigation or a significant change, or just a delay
                    await page.waitForURL((url) => url.href !== page.url(), { timeout: 10000, waitUntil: 'domcontentloaded' }).catch(() => {});
                    if (page.url() !== url) {
                        console.log('Navigation occurred after submit. New URL:', page.url());
                    } else {
                        console.log('No navigation detected, but submit was clicked. Checking for success/error messages on page or XHRs.');
                        // Potentially wait for specific elements indicating success/failure if no navigation
                        await page.waitForTimeout(3000); // General wait
                    }
                } catch (navError) {
                    console.log('No immediate navigation or error during wait after submit.');
                }
                submitBtnFoundAndClicked = true;
                break; 
            }
        }
        if (submitBtnFoundAndClicked) break;
    } catch (e) {
        // console.warn(`Error processing selector ${selector} for submit button: ${e.message.split('\n')[0]}`);
    }
  }

  if (!submitBtnFoundAndClicked) {
    console.warn('COULD NOT AUTOMATICALLY CLICK A SUBMIT BUTTON. Review screenshot and submit manually if needed.');
    const noSubmitPath = path.resolve(__dirname, `app_state_NO_SUBMIT_CLICKED_${Date.now()}.png`);
    await page.screenshot({ path: noSubmitPath, fullPage: true });
    console.log(`✅ Screenshot (no submit clicked): ${noSubmitPath}`);
  } else {
    const postSubmitPath = path.resolve(__dirname, `app_state_AFTER_SUBMIT_ATTEMPT_${Date.now()}.png`);
    await page.screenshot({ path: postSubmitPath, fullPage: true });
    console.log(`✅ Post-submit attempt screenshot: ${postSubmitPath}`);
  }

  console.log("--- ApplyToJob Function Finished ---");
  // await agent.closeAgent(); // Manage agent lifecycle (e.g., close after each job or keep open for a batch)
}

module.exports = { applyToJob };