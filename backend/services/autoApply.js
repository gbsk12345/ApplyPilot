const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')
const { compareTwoStrings } = require('string-similarity')

function normalize(str) {
  return typeof str === 'string'
    ? str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    : ''
}

async function applyToJob(url, userData) {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

  const userMap = {}
  for (const key in userData) {
    const norm = normalize(key)
    if (norm) userMap[norm] = userData[key]
  }

  const resumeInput = await page.$('input#resume[type="file"]')
  if (resumeInput) {
    const resumePath = path.resolve(__dirname, 'resume.pdf')
    if (!fs.existsSync(resumePath)) throw new Error(`Resume not found`)
    await resumeInput.setInputFiles(resumePath)
    await resumeInput.dispatchEvent('change')
    await resumeInput.dispatchEvent('input')
    await page.waitForTimeout(1500)
    console.log('Resume uploaded')
  }

  const form = await page.$('form')
  if (!form) return

  const controls = await form.$$('input, select, textarea')
  for (const field of controls) {
    const typeAttr = (await field.getAttribute('type') || '').toLowerCase()
    if (typeAttr === 'file') continue

    let labelEl = null
    const id = await field.getAttribute('id')
    if (id) labelEl = await form.$(`label[for="${id}"]`)
    if (!labelEl) {
      const handle = await field.evaluateHandle(el => el.closest('label'))
      labelEl = handle.asElement() || null
    }
    if (!labelEl) continue

    const rawLabel = await labelEl.evaluate(el => el.innerText)
    const normLabel = normalize(rawLabel.replace('*', '').trim())
    if (!normLabel) continue

    let bestKey = null
    let bestScore = 0
    for (const k of Object.keys(userMap)) {
      const score = compareTwoStrings(normLabel, k)
      if (score > bestScore) {
        bestScore = score
        bestKey = k
      }
    }
    if (!bestKey || bestScore < 0.85) {
      const partial = Object.keys(userMap).find(k => normLabel.includes(k) || k.includes(normLabel))
      if (partial) bestKey = partial
      else continue
    }
    const value = userMap[bestKey]

    const tag = await field.evaluate(el => el.tagName.toLowerCase())
    const role = await field.getAttribute('role')

    if (tag === 'input') {
      if (['text','email','tel','number','url','search','password','date'].includes(typeAttr)) {
        if (role === 'combobox') {
          await field.click({ force: true })
          await field.type(value)
          await page.waitForTimeout(1500)
          await page.keyboard.press('ArrowDown')
          await page.keyboard.press('Enter')
        } else {
          await field.fill(value)
        }
      } else if (typeAttr === 'checkbox') {
        const v = String(value).toLowerCase()
        if (['true','yes','1','on'].includes(v)) await field.check({ force: true })
      }
    } else if (tag === 'textarea') {
      await field.fill(value)
    } else if (tag === 'select') {
      try {
        await field.selectOption({ label: value })
      } catch {
        await field.click()
        await page.waitForTimeout(1500)
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('Enter')
      }
    }
  }
}

module.exports = { applyToJob }
