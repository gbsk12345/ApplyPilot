/* eslint-disable */
try { require('@img/sharp-libvips-darwin-arm64'); } catch {}
require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');
const { HyperAgent }  = require('@hyperbrowser/agent');
const path            = require('path');
const fs              = require('fs');

function normalize(s){
  return typeof s==='string'
    ? s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
    : '';
}
const rnd = (min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const delay=(page,min,max)=>page.waitForTimeout(rnd(min,max));

function overlapScore(a,b){
  const A=new Set(a.split(' ').filter(w=>w.length>1));
  const B=new Set(b.split(' ').filter(w=>w.length>1));
  if(!A.size||!B.size) return 0;
  let common=0; for(const w of B) if(A.has(w)) common++;
  return common/A.size;
}

async function getNativeField(handle){
  if(!handle) return null;
  const tag = await handle.evaluate(el=>el.tagName);
  if(tag && tag.startsWith('SPL-')){
    const inner = await handle.evaluateHandle(el=>{
      return el.shadowRoot && el.shadowRoot.querySelector('input,textarea');
    });
    return inner.asElement();
  }
  return handle;
}

async function applyToSmartRecruiters(url,userData){
  if(!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');

  const agent = new HyperAgent({
    llm: new ChatOpenAI({
      modelName:    'gpt-4o-mini',
      openAIApiKey: process.env.OPENAI_API_KEY
    })
  });

  const page  = await agent.newPage();
  console.log(`[INFO] Navigating to ${url}`);
  await page.goto(url,{waitUntil:'load',timeout:60_000});

  // handle embedded iframe
  let frame = page;
  const iframe = await page.$('iframe[src*="smartrecruiters.com"]');
  if(iframe){
    const f = await iframe.contentFrame();
    if(f) frame = f;
  }

  // wait for the form to load
  await frame.waitForSelector(
    'spl-typography-title[data-test="section-title"]',
    { state:'visible', timeout:30_000 }
  );
  await delay(frame,500,1000);

  // optional resume upload
  if(userData.resume){
    const p = fs.existsSync(path.resolve(__dirname,userData.resume))
             ? path.resolve(__dirname,userData.resume)
             : path.resolve(__dirname,'resume.pdf');
    const input = await frame.$(
      'spl-dropzone[data-test="resume-upload"] input[type=file]'
    );
    if(input){
      console.log('[INFO] Uploading resume');
      await input.setInputFiles(p);
      await delay(frame,400,800);
    }
  }

  // mapping of your userData fields to selectors
  const fields = {
    firstName          :'spl-input#first-name-input',
    lastName           :'spl-input#last-name-input',
    email              :'spl-input#email-input',
    emailConfirmation  :'spl-input#confirm-email-input',
    location           :'spl-autocomplete#spl-form-element_10',
    phone              :'spl-phone-field#spl-form-element_5',
    linkedIn           :'spl-input#linkedin-input',
    facebook           :'spl-input#facebook-input',
    twitter            :'spl-input#twitter-input',
    website            :'spl-input#website-input',
    message            :'spl-textarea#hiring-manager-message-input'
  };

  // ────────── PHONE ──────────
  if(userData.phone){
    const phoneRaw = String(userData.phone).trim();
    console.log(`[INFO] Filling phone field with "${phoneRaw}"`);
    const phoneHost = await frame.$('spl-phone-field#spl-form-element_5');
    if(phoneHost){
      // try our normal helper first
      let telInput = await getNativeField(
        await phoneHost.$('spl-input[type="tel"]')
      );
      if(!telInput){
        // fallback deep into shadow DOM
        const handle = await phoneHost.evaluateHandle(el => {
          const comp = el.shadowRoot?.querySelector('spl-input');
          return comp?.shadowRoot?.querySelector('input') || null;
        });
        telInput = handle?.asElement() || null;
      }
      if(telInput){
        await telInput.click({clickCount:2});
        await delay(frame,100,200);
        await telInput.fill('');
        await telInput.type(phoneRaw, {delay:50});
        await frame.keyboard.press('Tab');
      } else {
        console.warn('[WARN] Couldn’t find inner <input> for phone');
      }
    } else {
      console.warn('[WARN] spl-phone-field host not found');
    }
  }

  // ────────── OTHER FIELDS ──────────
  const missing = [];
  console.log('[INFO] Starting to fill mapped fields');
  for(const [key,sel] of Object.entries(fields)){
    if(!userData[key]) continue;
    console.log(`  → "${key}" via selector "${sel}"`);
    const host = await frame.$(sel);
    const field = await getNativeField(host);
    if(!field){
      console.warn(`    [WARN] "${key}" not found, will LLM-fallback`);
      missing.push(key);
      continue;
    }
    await field.click({clickCount:2});
    await delay(frame,100,250);
    await field.fill('');
    await field.type(String(userData[key]),{delay:50});
    await delay(frame,150,350);
    await frame.keyboard.press('Tab');
    await delay(frame,100,200);
  }

  // ────────── LLM FALLBACK ──────────
  if(missing.length){
    const taskPrompt =
      'Fill the following fields on this SmartRecruiters form:\n' +
      missing.map(m=>`- ${m}: ${userData[m]||''}`).join('\n');
    console.log(`[INFO] Falling back on LLM for: ${missing.join(', ')}`);
    await agent.executeTask(taskPrompt, {
      onStep: (step) => {
        console.log(`===== STEP ${step.idx} =====`);
        console.dir(step, { depth:null, colors:true });
        console.log('===============');
      }
    });
  }

  // ────────── CLICK NEXT ──────────
  const nextBtn = await frame.$(
    'oc-button[data-test="footer-next"] button, \
     oc-button[data-test="footer-next"] spl-button'
  );
  if(nextBtn){
    console.log('[INFO] Clicking Next');
    await nextBtn.click();
  } else {
    console.warn('[WARN] Next button not found (validation error?)');
  }

  // wait for screening or final submit
  try {
    await Promise.race([
      frame.waitForSelector('sr-screening-questions-form',{ state:'visible', timeout:60_000 }),
      frame.waitForSelector('oc-button[data-test="footer-submit"]',{ state:'visible', timeout:60_000 })
    ]);
  } catch {
    console.warn('[SmartRecruiters] no next page – stopping early.');
    await agent.closeAgent();
    return;
  }
  await delay(frame,500,1000);

  await agent.closeAgent();
}

module.exports = { applyToSmartRecruiters };
