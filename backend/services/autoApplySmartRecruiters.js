try{require('@img/sharp-libvips-darwin-arm64')}catch{}
require('dotenv').config()
const{ChatOpenAI}=require('@langchain/openai')
const{HyperAgent}=require('@hyperbrowser/agent')
const path=require('path')
const fs=require('fs')

const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a
const delay=(p,a,b)=>p.waitForTimeout(rnd(a,b))

async function native(f,h){
  if(!h)return null
  for(let i=0;i<10;i++){
    const eh=await h.evaluateHandle(e=>(e.shadowRoot||e).querySelector('input,textarea'))
    const el=eh.asElement()
    if(el&&await el.isVisible())return el
    await delay(f,300,300)
  }
  return null
}

async function clickDeep(f,sel){
  const oc=await f.$(sel)
  const spl=oc&&await oc.evaluateHandle(e=>e.shadowRoot?.querySelector('spl-button')).then(h=>h.asElement())
  const btn=spl&&await spl.evaluateHandle(e=>e.shadowRoot?.querySelector('button')).then(h=>h.asElement())
  const tap=async el=>{
    await el.scrollIntoViewIfNeeded()
    await el.dispatchEvent('pointerdown')
    await el.dispatchEvent('pointerup')
    await el.dispatchEvent('click',{bubbles:true})
  }
  if(btn){await tap(btn);return true}
  if(spl){await tap(spl);return true}
  if(oc){await tap(oc);return true}
  return false
}

async function handleFirstPage(f,u){
  const pdf=path.resolve(__dirname,'resume.pdf')
  if(fs.existsSync(pdf)){
    const dz=await f.$('spl-dropzone[data-test="resume-upload"]')
    if(dz){
      const h=await dz.evaluateHandle(e=>{
        const dfs=n=>{
          if(!n)return null
          if(n.matches&&n.matches('input[type="file"]'))return n
          const c=[...(n.children||[]),...(n.shadowRoot?Array.from(n.shadowRoot.children):[])]
          for(const x of c){const r=dfs(x);if(r)return r}
          return null
        }
        return dfs(e)
      })
      const fi=h.asElement()
      if(fi){
        await fi.setInputFiles(pdf)
        await fi.dispatchEvent('change')
        await fi.dispatchEvent('input')
        await delay(f,2500,3000)
      }
    }
  }

  const map={
    'First Name':'spl-input#first-name-input',
    'Last Name':'spl-input#last-name-input',
    Email:'spl-input#email-input',
    'Location (City)':'spl-autocomplete[data-test="location-autocomplete"]',
    'LinkedIn Profile':'spl-input#linkedin-input',
    Website:'spl-input#website-input',
    Message:'spl-textarea#hiring-manager-message-input'
  }

  if(u.Phone){
    const host=await f.$('spl-phone-field#spl-form-element_5')
    if(host){
      const h=await host.evaluateHandle(e=>e.shadowRoot?.querySelector('spl-input')?.shadowRoot?.querySelector('input'))
      const tel=h.asElement()
      if(tel){
        await tel.click({clickCount:3})
        await tel.type(String(u.Phone),{delay:30})
        await f.keyboard.press('Tab')
      }
    }
  }

  for(const[k,sel]of Object.entries(map)){
    if(!u[k])continue
    const host=await f.$(sel)
    if(!host)continue
    let fld
    if(k==='Location (City)'){
      const h=await host.evaluateHandle(e=>e.shadowRoot?.querySelector('spl-input')?.shadowRoot?.querySelector('input'))
      fld=h.asElement()
    }else fld=await native(f,host)
    if(fld){
      await fld.click({clickCount:1})
      await fld.fill(String(u[k]))
      if(k==='Location (City)'){
        await delay(f,1000,1200)
        await f.keyboard.press('ArrowDown')
        await f.keyboard.press('ArrowUp')
        await delay(f,200,300)
        await f.keyboard.press('Enter')
      }
      if(k==='Email'){
        const c=await f.$('spl-input#confirm-email-input')
        const cf=await native(f,c)
        if(cf)await cf.fill(String(u[k]))
      }
    }
  }

  await clickDeep(f,'oc-button[data-test="footer-next"]')
  await delay(f,5000,5000)
}

function buildScreening(u){
  const d=v=>u[v]||'No'
  const today=new Date().toLocaleDateString('en-US')
  const sig=((u['First Name']||'')+' '+(u['Last Name']||'')).trim()
  return{
    'Have you ever worked at ServiceNow in any capacity':d('Worked at ServiceNow'),
    'If applicable, would you consider relocating for a role with ServiceNow?':u['Consider relocating']||'Yes',
    'Is your current employer a customer of ServiceNow?':d('Employer customer'),
    'Are you legally authorized to work in the country in which you are applying for a role?':u['Authorized to work']||'Yes',
    'Do you now, or will you in the future, require visa sponsorship to work for ServiceNow in the country of hire?':u['Need sponsorship']||'No',
    'Are you currently employed or have you ever been employed by PwC?':d('Worked at PwC'),
    'Are you a citizen or lawful permanent resident of Cuba, Syria, Iran, North Korea, or the Crimea, Donetsk, or Luhansk regions of Ukraine?':d('Citizen restricted'),
    'A. Have you ever been an employee of the U.S. Federal Government?':d('Fed employee'),
    'B. Are you a current employee of the U.S. Federal Government':d('Current fed'),
    'C. Have you ever been an employee of a state, local, or municipal government entity':d('State employee'),
    'D. Has a member of your Immediate Family':d('Immediate family gov'),
    'E. Are you currently, or have you been previously, suspended':d('Suspended'),
    'Name (Signature Field):':sig,
    "Today's date":today,
    Gender:u.Gender||'Prefer not to answer',
    'Race/Ethnicity':u.Race||'Prefer not to answer',
    'Do you have (or have a history/record of having) a disability?':u['Disability Status']||'I do not want to answer.',
    'Are you a protected veteran?':u['Veteran Status']||'Prefer not to answer'
  }
}

async function fillCombo(f,ph,val){
  if(!val)return
  const inp=await f.$(`input[placeholder="${ph}"]`)
  if(!inp)return
  await inp.fill(val)
  await delay(f,1200,1500)
  await f.keyboard.press('ArrowDown')
  await f.keyboard.press('Enter')
}

async function handleScreening(f,p,u){
  await f.waitForSelector('sr-screening-questions-form',{timeout:30000})
  const ans=buildScreening(u)
  const blocks=await f.$$('[data-test="screening-questions-form"] [data-test^="question"]')
  const norm=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
  const miss=[]
  for(const b of blocks){
    const raw=await b.innerText()
    const label=raw.split('\n')[0].replace('*','').trim()
    let v=''
    for(const k in ans){if(norm(k).includes(norm(label))||norm(label).includes(norm(k))){v=ans[k];break}}
    if(!v){miss.push(label);continue}
    const inp=await b.$('input,textarea,select,[role="combobox"]')
    if(!inp){miss.push(label);continue}
    const tag=await inp.evaluate(e=>e.tagName.toLowerCase())
    const type=(await inp.getAttribute('type')||'').toLowerCase()
    const role=await inp.getAttribute('role')
    try{
      if(tag==='textarea')await inp.fill(v)
      else if(tag==='select'){await inp.selectOption({label:v}).catch(async()=>{await inp.click();await delay(f,1000,1200);await f.keyboard.press('ArrowDown');await f.keyboard.press('Enter')})}
      else if(tag==='input'&&['radio','checkbox'].includes(type)){const opt=await b.$(`label:text-is("${v}")`);if(opt)await opt.click({force:true});else await inp.check({force:true})}
      else if(tag==='input'&&type==='text')await inp.fill(v)
      else if(role==='combobox'){await inp.fill(v);await delay(f,1200,1500);await f.keyboard.press('ArrowDown');await f.keyboard.press('Enter')}
      else miss.push(label)
    }catch{miss.push(label)}
  }

  await fillCombo(f,'Gender',ans.Gender)
  await fillCombo(f,'Race/Ethnicity',ans['Race/Ethnicity'])

  if(miss.length){
    let prompt='Fill all remaining required questions:\n'
    for(const m of miss)prompt+=`- ${m}: ${ans[m]||'No'}\n`
    prompt+='\nTick the privacy checkbox and press Submit.'
    await p.ai(prompt)
  }

  const cb=await f.$('oc-checkbox[data-test="consent-box"]')
  if(cb){
    const spl=await cb.evaluateHandle(e=>e.shadowRoot?.querySelector('spl-checkbox')).then(h=>h.asElement())
    const real=spl&&await spl.evaluateHandle(e=>e.shadowRoot?.querySelector('input')).then(h=>h.asElement())
    if(real&&!await real.isChecked())await real.click({force:true})
  }
  await clickDeep(f,'oc-button[data-test="footer-submit"]')
  await delay(f,5000,5000)
}

async function applyToSmartRecruiters(url,u){
  if(!process.env.OPENAI_API_KEY)throw new Error('Missing OPENAI_API_KEY')
  const agent=new HyperAgent({llm:new ChatOpenAI({modelName:'gpt-4o-mini',openAIApiKey:process.env.OPENAI_API_KEY})})
  const p=await agent.newPage()
  try{
    await p.goto(url,{waitUntil:'load',timeout:60000})
    let f=p
    const ifr=await p.$('iframe[src*="smartrecruiters.com"]')
    if(ifr){const cf=await ifr.contentFrame();if(cf)f=cf}
    await f.waitForSelector('oc-personal-information',{state:'visible',timeout:30000})
    await delay(f,500,1000)
    await handleFirstPage(f,u)
    await handleScreening(f,p,u)
  }finally{
    await agent.closeAgent()
  }
}

module.exports={applyToSmartRecruiters}
