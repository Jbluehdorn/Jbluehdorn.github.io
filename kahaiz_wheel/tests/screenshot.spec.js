import { test, expect } from '@playwright/test'
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import bosses from '../src/data/bosses.js'
import skills from '../src/data/skills.js'

const winners = [
  { name: 'Amoxliatl', type: 'Boss' },
  { name: 'Vorkath', type: 'BOTW' },
  { name: 'Magic', type: 'SOTW' },
]

async function openWinner(page, winner) {
  await page.addInitScript(({ bosses, skills, winner }) => {
    for (const [type, items] of [['BOSS', bosses], ['BOTW', bosses], ['SOTW', skills]]) {
      localStorage.setItem(type, JSON.stringify(items.map(item => ({
        ...item, enabled: item.name === (type === 'BOSS' && winner.type === 'SOTW' ? 'Amoxliatl' : winner.name),
      }))))
    }
    localStorage.setItem('kahaiz_audio_prefs', JSON.stringify({ muted: true, musicSong: 'none', foundSong: 'none' }))
    window.screenshotTest = { exports: [], cloneStyles: [] }
    const writeClipboard = navigator.clipboard.write.bind(navigator.clipboard)
    navigator.clipboard.write = async (items) => {
      const blob = await items[0].getType('image/png')
      const bytes = new Uint8Array(await blob.arrayBuffer())
      let binary = ''
      for (const byte of bytes) binary += String.fromCharCode(byte)
      window.screenshotTest.exports.push(btoa(binary))
      if (window.screenshotTest.holdClipboard) {
        await new Promise((resolve, reject) => {
          window.screenshotTest.resolveClipboard = resolve
          window.screenshotTest.rejectClipboard = reject
        })
      }
      if (window.screenshotTest.nativeClipboard) await writeClipboard(items)
    }
    const getStyle = window.getComputedStyle
    window.getComputedStyle = function (element, ...args) {
      const style = getStyle.call(this, element, ...args)
      if (element.ownerDocument !== document && element.matches('.winner-banner')) {
        window.screenshotTest.cloneStyles.push({
          opacity: style.opacity, transform: style.transform, animation: style.animationName,
        })
      }
      return style
    }
  }, { bosses, skills, winner })
  await page.clock.install({ time: new Date('2026-10-12T12:00:00Z') })
  await page.goto('/')
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: winner.type, exact: true }).click()
  await expect(page.locator('.item-tag.enabled')).toHaveCount(1)
  await expect(page.locator('.item-tag.enabled')).toHaveText(winner.name)
  await page.locator('.item-tag.enabled img').evaluate(image => image.decode())
  await page.locator('.modal-close-btn').click()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))

  const box = await page.locator('.wheel-canvas').boundingBox()
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  const radius = box.width / 3
  await page.mouse.move(x + radius, y)
  await page.mouse.down()
  await page.clock.runFor(40)
  await page.mouse.move(x + radius * Math.cos(0.4), y + radius * Math.sin(0.4), { steps: 4 })
  await page.mouse.up()
  await page.clock.fastForward(60000)
  await page.clock.fastForward(2000)
  await expect(page.locator('.winner-name')).toHaveText(winner.name)
  await page.locator('.winner-image').evaluate(image => image.decode())
  await page.evaluate(() => document.fonts.ready)
  await expect.poll(() => page.locator('.winner-banner').evaluate(element => getComputedStyle(element).opacity)).toBe('1')
}

async function copyPng(page, index = 0) {
  await page.locator('.winner-copy').click()
  await page.waitForFunction(index => window.screenshotTest.exports.length > index, index)
  return Buffer.from(await page.evaluate(index => window.screenshotTest.exports[index], index), 'base64')
}

async function browserReference(page) {
  // Only after the real export: do not suppress the clone's entrance animation in the regression.
  const layout = await page.evaluate(() => {
    const banner = document.querySelector('.winner-banner')
    const elements = [banner, ...banner.querySelectorAll('*')]
    window.screenshotReferenceStyles = elements.map(element => [element, element.getAttribute('style')])
    for (const element of elements) element.style.animation = 'none'
    banner.style.boxShadow = 'none'
    banner.querySelector('.winner-glow').style.visibility = 'hidden'
    banner.querySelector('.winner-actions').style.display = 'none'
    const bounds = banner.getBoundingClientRect()
    const rectangle = (element) => {
      const box = element.getBoundingClientRect()
      return { x: box.x - bounds.x, y: box.y - bounds.y, width: box.width, height: box.height }
    }
    const image = banner.querySelector('.winner-image')
    const imageBox = rectangle(image)
    const scale = window.devicePixelRatio
    const mask = document.createElement('canvas')
    mask.width = Math.round(imageBox.width * scale)
    mask.height = Math.round(imageBox.height * scale)
    const fit = Math.min(mask.width / image.naturalWidth, mask.height / image.naturalHeight)
    const width = image.naturalWidth * fit
    const height = image.naturalHeight * fit
    mask.getContext('2d').drawImage(image, (mask.width - width) / 2, (mask.height - height) / 2, width, height)
    const text = (selector) => {
      const element = banner.querySelector(selector)
      return { box: rectangle(element), color: getComputedStyle(element).color.match(/\d+/g).slice(0, 3).map(Number) }
    }
    return {
      scale, image: imageBox, mask: mask.toDataURL(), name: text('.winner-name'), subtitle: text('.winner-subtitle'),
      naturalSize: [image.naturalWidth, image.naturalHeight],
    }
  })
  try {
    return { png: await page.locator('.winner-banner').screenshot(), layout }
  } finally {
    await page.evaluate(() => {
      for (const [element, style] of window.screenshotReferenceStyles) {
        if (style === null) element.removeAttribute('style')
        else element.setAttribute('style', style)
      }
      delete window.screenshotReferenceStyles
    })
  }
}

const brightness = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex')
const distance = (a, b) => a.reduce((sum, channel, i) => sum + Math.abs(channel - b[i]), 0) / 3
const pixel = (image, x, y) => {
  const offset = (y * image.info.width + x) * 4
  return [...image.data.subarray(offset, offset + 3)]
}

async function colorFidelity(exportPng, reference) {
  const original = await sharp(exportPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const expected = await sharp(reference.png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const actual = await sharp(exportPng)
    .resize(expected.info.width, expected.info.height, { fit: 'fill' })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const mask = await sharp(Buffer.from(reference.layout.mask.split(',')[1], 'base64'))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { scale, image } = reference.layout
  const left = Math.round(image.x * scale)
  const top = Math.round(image.y * scale)
  let samples = 0
  let error = 0
  let expectedBrightness = 0
  let actualBrightness = 0
  let example
  for (let y = 2; y < mask.info.height - 2; y += 2) {
    for (let x = 2; x < mask.info.width - 2; x += 2) {
      if (mask.data[(y * mask.info.width + x) * 4 + 3] < 254) continue
      const target = pixel(expected, left + x, top + y)
      if (brightness(target) < 45) continue
      let closest
      let smallest = Infinity
      // Browser and canvas rasterizers can place antialiased edges one device pixel apart.
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const candidate = pixel(actual, left + x + dx, top + y + dy)
          const difference = distance(target, candidate)
          if (difference < smallest) {
            closest = candidate
            smallest = difference
          }
        }
      }
      samples++
      error += smallest
      expectedBrightness += brightness(target)
      actualBrightness += brightness(closest)
      if (!example || brightness(target) > brightness(example.browser)) example = { browser: target, png: closest }
    }
  }
  const textColor = ({ box, color }) => {
    const scan = (raster) => {
      let minimum = Infinity
      let nearest
      let matching = 0
      for (let y = Math.ceil(box.y * scale); y < Math.floor((box.y + box.height) * scale); y++) {
        for (let x = Math.ceil(box.x * scale); x < Math.floor((box.x + box.width) * scale); x++) {
          const rgb = pixel(raster, x, y)
          const difference = distance(rgb, color)
          if (difference <= 3) matching++
          if (difference < minimum) { minimum = difference; nearest = rgb }
        }
      }
      return { rgb: nearest, error: minimum, matching }
    }
    return { css: color, browser: scan(expected), png: scan(actual) }
  }
  return {
    dimensions: { browser: [expected.info.width, expected.info.height], png: [original.info.width, original.info.height] },
    photo: { samples, meanRgbError: error / samples, brightnessRatio: actualBrightness / expectedBrightness, example },
    name: textColor(reference.layout.name),
    subtitle: textColor(reference.layout.subtitle),
    alpha: { minimum: (await sharp(exportPng).stats()).channels[3].min },
  }
}

for (const winner of winners) {
  test(`${winner.type}: ${winner.name} PNG preserves artwork and text colors`, async ({ page }, testInfo) => {
    await openWinner(page, winner)
    const liveStyles = await page.locator('.winner-banner').evaluate(element => ({
      animation: getComputedStyle(element).animationName,
      imageAnimation: getComputedStyle(element.querySelector('.winner-image')).animationName,
    }))
    const png = await copyPng(page)
    await expect(page.locator('.winner-copy')).toHaveText('✓ Copied!')
    const reference = await browserReference(page)
    const measurements = await colorFidelity(png, reference)
    measurements.cloneStyles = await page.evaluate(() => window.screenshotTest.cloneStyles)
    measurements.naturalSize = reference.layout.naturalSize
    for (const [name, body, contentType] of [
      ['export.png', png, 'image/png'],
      ['browser-reference.png', reference.png, 'image/png'],
      ['fidelity.json', JSON.stringify(measurements, null, 2), 'application/json'],
    ]) {
      const file = testInfo.outputPath(name)
      await writeFile(file, body)
      await testInfo.attach(name, { path: file, contentType })
    }

    expect.soft(measurements.photo.samples).toBeGreaterThan(50)
    expect.soft(measurements.photo.meanRgbError).toBeLessThan(5)
    expect.soft(measurements.photo.brightnessRatio).toBeGreaterThan(0.96)
    expect.soft(measurements.photo.brightnessRatio).toBeLessThan(1.04)
    expect.soft(measurements.name.png.error).toBeLessThanOrEqual(3)
    expect.soft(measurements.name.png.matching).toBeGreaterThan(5)
    expect.soft(measurements.subtitle.png.error).toBeLessThanOrEqual(3)
    expect.soft(measurements.subtitle.png.matching).toBeGreaterThan(5)
    expect.soft(measurements.alpha.minimum).toBe(255)
    for (let i = 0; i < 2; i++) {
      expect.soft(Math.abs(measurements.dimensions.browser[i] - measurements.dimensions.png[i])).toBeLessThanOrEqual(2)
    }
    await expect(page.locator('.winner-actions')).toBeVisible()
    expect(await page.locator('.winner-banner').evaluate(element => ({
      animation: getComputedStyle(element).animationName,
      imageAnimation: getComputedStyle(element.querySelector('.winner-image')).animationName,
    }))).toEqual(liveStyles)
    expect(hash(await copyPng(page, 1))).toBe(hash(png))
  })
}

test('native clipboard PNG retains the captured pixels', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await openWinner(page, winners[0])
  await page.evaluate(() => { window.screenshotTest.nativeClipboard = true })
  const captured = await copyPng(page)
  await expect(page.locator('.winner-copy')).toHaveText('✓ Copied!')
  const clipboard = Buffer.from(await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read()
    const blob = await item.getType('image/png')
    return [...new Uint8Array(await blob.arrayBuffer())]
  }))
  // The OS clipboard may omit the all-opaque alpha channel when it re-encodes the PNG.
  expect(hash(await sharp(clipboard).ensureAlpha().raw().toBuffer()))
    .toBe(hash(await sharp(captured).ensureAlpha().raw().toBuffer()))
})

test('waits for the clipboard and recovers from denied writes', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await openWinner(page, winners[0])
  await page.evaluate(() => { window.screenshotTest.holdClipboard = true })
  await copyPng(page)
  await expect(page.locator('.winner-copy')).toBeDisabled()
  await page.evaluate(() => window.screenshotTest.rejectClipboard(new DOMException('Denied', 'NotAllowedError')))
  await expect(page.locator('.winner-copy')).toBeEnabled()
  await expect(page.locator('.winner-copy')).toHaveText('📋 Copy')
  expect(errors).toEqual([])
  await page.evaluate(() => { window.screenshotTest.holdClipboard = false })
  await copyPng(page, 1)
  await expect(page.locator('.winner-copy')).toHaveText('✓ Copied!')
  await page.getByRole('button', { name: 'Spin Again', exact: true }).click()
  await expect(page.locator('.winner-banner')).toHaveCount(0)
})
