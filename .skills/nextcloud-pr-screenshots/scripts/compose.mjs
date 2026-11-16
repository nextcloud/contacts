#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Combine the shots in manifest.json into one labeled PNG.
// Usage: node compose.mjs <out dir> [--sha abc1234] [--max-width 1100] [--page-width 2300]
// Sections become headers; shots flow left to right and wrap; "before" sits left of its "after".

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { importPlaywright, loadEnv, parseArgs } from './lib/env.mjs'

const MAX_BYTES = 10 * 1024 * 1024
const args = parseArgs(process.argv.slice(2))
const outDir = path.resolve(args._[0] ?? '.')
const { entries } = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'))
const maxWidth = Number(args['max-width'] ?? 1100)
const pageWidth = Number(args['page-width'] ?? 2300)
let sha = args.sha
if (!sha) {
	try {
		sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
	} catch {
		sha = 'local'
	}
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const img = (e) => `<img src="${esc(e.file)}" alt="">`

// section → ordered labels → { before, after, plain }
const sections = new Map()
for (const e of entries) {
	if (!fs.existsSync(path.join(outDir, e.file))) {
		continue
	}
	const labels = sections.get(e.section) ?? new Map()
	sections.set(e.section, labels)
	const slot = labels.get(e.label) ?? {}
	labels.set(e.label, slot)
	slot[e.tag === 'before' ? 'before' : e.tag === 'after' ? 'after' : 'plain'] = e
}

let body = ''
for (const [section, labels] of sections) {
	body += `<section><h2>${esc(section)}</h2><div class="row">`
	for (const [label, slot] of labels) {
		if (slot.before && slot.after) {
			body += `<figure class="pair"><figcaption>${esc(label)}</figcaption><div class="pair-row">
				<div><span class="tag">Before</span>${img(slot.before)}</div>
				<div><span class="tag">After</span>${img(slot.after)}</div></div></figure>`
		} else {
			const e = slot.plain ?? slot.after ?? slot.before
			const tag = slot.before ? ' (before)' : ''
			body += `<figure><figcaption>${esc(label + tag)}</figcaption>${img(e)}</figure>`
		}
	}
	body += '</div></section>'
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body { margin: 0; padding: 24px; background: #e9ebee; font: 18px/1.3 system-ui, sans-serif; color: #222; width: ${pageWidth}px; box-sizing: border-box; }
h2 { font-size: 26px; margin: 8px 0 12px; }
section + section { margin-top: 28px; }
.row { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
figure { margin: 0; }
figcaption { margin-bottom: 6px; color: #444; }
img { display: block; max-width: ${maxWidth}px; border: 1px solid #9aa0a6; background: #fff; }
.pair-row { display: flex; gap: 12px; }
.pair { padding: 10px; border: 1px dashed #9aa0a6; border-radius: 6px; }
.tag { display: inline-block; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #555; margin-bottom: 4px; }
</style></head><body>${body}</body></html>`

const htmlFile = path.join(outDir, 'composite.html')
fs.writeFileSync(htmlFile, html)

const env = loadEnv()
const { chromium } = await importPlaywright()
const browser = await chromium.launch(env.chromePath ? { executablePath: env.chromePath } : {})
const page = await browser.newPage({ viewport: { width: pageWidth, height: 800 } })
await page.goto('file://' + htmlFile)
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))))
// Fit the page to the widest row, so there is no empty right margin
const width = await page.evaluate(() => Math.ceil(Math.max(...[...document.querySelectorAll('.row')].map((r) => Math.max(...[...r.children].map((c) => c.getBoundingClientRect().right)))) + 24))
await page.evaluate((w) => { document.body.style.width = `${w}px` }, Math.min(width, pageWidth))
await page.setViewportSize({ width: Math.min(width, pageWidth), height: 800 })

const file = path.join(outDir, `screenshots-${sha}.png`)
let zoom = 1
for (;;) {
	await page.evaluate((z) => { document.body.style.zoom = z }, zoom)
	await page.screenshot({ path: file, fullPage: true })
	if (fs.statSync(file).size <= MAX_BYTES || zoom < 0.5) {
		break
	}
	zoom -= 0.15
}
await browser.close()
const size = (fs.statSync(file).size / 1024 / 1024).toFixed(1)
console.log(`${file} (${size} MB${zoom < 1 ? `, scaled to ${Math.round(zoom * 100)}% to stay under 10 MB` : ''})`)
