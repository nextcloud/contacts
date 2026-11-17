#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Combine the shots in <out dir>/manifest.json into one labeled PNG, each "before" left of its "after".
// Usage: node compose.mjs <out dir> [--sha abc1234]

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { importPlaywright, parseArgs } from './lib/env.mjs'

const args = parseArgs(process.argv.slice(2))
const outDir = path.resolve(args._[0] ?? '.')
const sha = typeof args.sha === 'string' ? args.sha : execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
const esc = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)

// section → label → shots, in manifest order
const sections = Map.groupBy(JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8')), (e) => e.section)
const html = [...sections].map(([section, shots]) => `<h2>${esc(section)}</h2><div class="row">${
	[...Map.groupBy(shots, (e) => e.label)].map(([label, same]) => `<figure><figcaption>${esc(label)}</figcaption><div class="row">${
		same.map((e) => `<div>${e.tag ? `<b>${esc(e.tag)}</b>` : ''}<img src="${esc(e.file)}"></div>`).join('')
	}</div></figure>`).join('')
}</div>`).join('')

const htmlFile = path.join(outDir, 'composite.html')
fs.writeFileSync(htmlFile, `<!doctype html><meta charset="utf-8"><style>
body { margin: 0; padding: 24px; width: max-content; max-width: 2300px; background: #e9ebee; font: 18px system-ui, sans-serif; color: #222; }
h2 { margin: 24px 0 12px; } .row { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
figure { margin: 0; } figcaption, b { display: block; margin-bottom: 6px; } b { font-size: 14px; text-transform: uppercase; color: #555; }
img { display: block; max-width: 1100px; border: 1px solid #9aa0a6; }
</style>${html}`)

const browser = await (await importPlaywright()).chromium.launch()
const page = await browser.newPage({ viewport: { width: 2400, height: 800 } })
await page.goto(`file://${htmlFile}`)
const file = path.join(outDir, `screenshots-${sha}.png`)
// GitHub rejects images over 10 MB
for (let zoom = 1; zoom >= 0.4; zoom -= 0.15) {
	await page.evaluate((z) => document.body.style.setProperty('zoom', z), zoom)
	await page.locator('body').screenshot({ path: file })
	if (fs.statSync(file).size <= 10 * 1024 * 1024) {
		break
	}
}
await browser.close()
console.log(file)
