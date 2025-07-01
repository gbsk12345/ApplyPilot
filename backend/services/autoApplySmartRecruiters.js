try{require('@img/sharp-libvips-darwin-arm64')}catch{}
require('dotenv').config()
const {ChatOpenAI}=require('@langchain/openai')
const {HyperAgent}=require('@hyperbrowser/agent')
const path=require('path')
const fs=require('fs')

const rnd=(min,max)=>Math.floor(Math.random()*(max-min+1))+min
const delay=(page,min,max)=>page.waitForTimeout(rnd(min,max))

async function getNativeField(frame,handle,retries=10,interval=300){
  if(!handle)return null
  for(let i=0;i<retries;i++){
    const inputHandle=await handle.evaluateHandle(el=>{
      const root=el.shadowRoot||el
      return root.querySelector('input, textarea')
    })
    const element=inputHandle.asElement()
    if(element&&await element.isVisible())return element
    if(i<retries-1)await delay(frame,interval,interval)
  }
  return null
}

async function applyToSmartRecruiters(url,userData){
  if(!process.env.OPENAI_API_KEY)throw new Error('Missing OPENAI_API_KEY')
  if(!userData||Object.keys(userData).length===0){
    console.error('[FATAL] The userData object is empty. No information to fill. Exiting.')
    return
  }
  const agent=new HyperAgent({llm:new ChatOpenAI({modelName:'gpt-4o-mini',openAIApiKey:process.env.OPENAI_API_KEY})})
  const page=await agent.newPage()
  try{
    console.log(`[INFO] Navigating to ${url}`)
    await page.goto(url,{waitUntil:'load',timeout:60000})
    let frame=page
    const iframe=await page.$('iframe[src*="smartrecruiters.com"]')
    if(iframe){
      const f=await iframe.contentFrame()
      if(f){frame=f;console.log('[INFO] Switched to SmartRecruiters iframe.')}
    }else{
      console.log('[INFO] No iframe detected, running on main page.')
    }
    await frame.waitForSelector('oc-personal-information',{state:'visible',timeout:30000})
    console.log('[INFO] Application form is visible.')
    await delay(frame,500,1000)

    // --- DEFINITIVE RESUME UPLOAD LOGIC ---
    // Always look for resume.pdf in the same directory as the script.
    const resumePath = path.resolve(__dirname, 'resume.pdf');
    if (fs.existsSync(resumePath)) {
        console.log(`[INFO] Found resume.pdf. Attempting to upload...`);
        // Using the specific selector you requested to avoid the autofill input.
        const dropzone = await frame.$('spl-dropzone[data-test="resume-upload"]');
        
        if (dropzone) {
            console.log('[INFO] Resume dropzone found. Searching for hidden file input...');
            const handle = await dropzone.evaluateHandle(el => {
                const walk = node => {
                    if (!node) return null;
                    if (node.matches && node.matches('input[type="file"]')) return node;
                    const children = [...(node.children || []), ...(node.shadowRoot ? Array.from(node.shadowRoot.children) : [])];
                    for (const child of children) {
                        const result = walk(child);
                        if (result) return result;
                    }
                    return null;
                };
                return walk(el);
            });
            
            const fileInput = handle.asElement();

            if (fileInput) {
                console.log('[INFO] Found hidden input. Setting files and dispatching events...');
                // 1. Set the file path on the input element.
                await fileInput.setInputFiles(resumePath);
                // 2. CRITICAL: Manually dispatch 'change' and 'input' events to ensure the framework detects the programmatic change.
                await fileInput.dispatchEvent('change');
                await fileInput.dispatchEvent('input');
                
                // 3. Replace the brittle waitForSelector with a simple, robust delay.
                console.log('[INFO] Upload command sent. Pausing for UI to process...');
                await delay(frame, 2500, 3000);
                console.log('[SUCCESS] Resume should now be uploaded.');
            } else {
                console.warn('[WARN] The hidden file input within the dropzone could not be found.');
            }
        } else {
            console.warn('[WARN] The specified resume drop-zone [data-test="resume-upload"] was not found.');
        }
    } else {
        console.warn(`[WARN] resume.pdf not found in script directory. Skipping upload.`);
    }

    const fields={
      'First Name':'spl-input#first-name-input',
      'Last Name':'spl-input#last-name-input',
      'Email':'spl-input#email-input',
      'Location (City)':'spl-autocomplete[data-test="location-autocomplete"]',
      'LinkedIn Profile':'spl-input#linkedin-input',
      'Website':'spl-input#website-input',
      'Message':'spl-textarea#hiring-manager-message-input'
    }

    if(userData['Phone']){
      const phoneRaw=String(userData['Phone']).trim()
      console.log(`[INFO] Filling phone field with "${phoneRaw}"`)
      const phoneHost=await frame.$('spl-phone-field#spl-form-element_5')
      if(phoneHost){
        const handle=await phoneHost.evaluateHandle(el=>{
          const comp=el.shadowRoot?.querySelector('spl-input')
          return comp?.shadowRoot?.querySelector('input')||null
        })
        const telInput=handle?.asElement()
        if(telInput){
          await telInput.click({clickCount:3})
          await telInput.type(phoneRaw,{delay:30})
          await frame.keyboard.press('Tab')
          console.log('[INFO] Phone field filled.')
        }else{
          console.warn('[WARN] Couldn’t find inner <input> for phone')
        }
      }else{
        console.warn('[WARN] spl-phone-field host not found')
      }
    }

    console.log('[INFO] Starting to fill other mapped fields')
    for(const [key,sel] of Object.entries(fields)){
      if(!userData[key])continue
      console.log(`  → Filling "${key}"`)
      const host=await frame.$(sel)
      if(!host){
        console.warn(`    [WARN] Host for "${key}" not found with selector: ${sel}`)
        continue
      }
      let field
      if(key==='Location (City)'){
        const handle=await host.evaluateHandle(el=>{
          const splInput=el.shadowRoot?.querySelector('spl-input')
          return splInput?.shadowRoot?.querySelector('input')
        })
        field=handle.asElement()
      }else{
        field=await getNativeField(frame,host)
      }
      if(field){
        await field.click({clickCount:1})
        await field.fill(String(userData[key]))
        if(key==='Location (City)'){
          await delay(frame,1000,1200)
          await frame.keyboard.press('ArrowDown')
          await frame.keyboard.press('ArrowUp')
          await delay(frame,200,300)
          await frame.keyboard.press('Enter')
        }else{
          await delay(frame,150,250)
        }
        if(key==='Email'){
          const confirmHost=await frame.$('spl-input#confirm-email-input')
          const confirmField=await getNativeField(frame,confirmHost)
          if(confirmField){
            console.log('    -> Also filling email confirmation...')
            await confirmField.fill(String(userData[key]))
          }
        }
      }else{
        console.warn(`    [WARN] Native input for "${key}" not found after retries.`)
      }
    }

    console.log('[INFO] All fields filled. Attempting to click "Next".')
    const nextButton=await frame.$('oc-button[data-test="footer-next"] button')
    if(nextButton&&await nextButton.isEnabled()){
      await nextButton.click()
      console.log('[SUCCESS] Clicked "Next" button.')
    }else{
      console.error('[ERROR] Could not click "Next" button. It is likely disabled due to form errors.')
    }
    await delay(frame,5000,5000)
  }catch(error){
    console.error('An error occurred during the automation process:',error)
  }finally{
    if(agent){
      await agent.closeAgent()
    }
  }
}

module.exports={applyToSmartRecruiters}