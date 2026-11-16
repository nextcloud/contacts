#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Run a shot list and write PNGs plus manifest.json for compose.mjs.
// Usage: node run.mjs <shots.mjs> [--out dir] [--only scene,scene] [--workers 4]
//                    [--explore] [--tag before|after] [--seed]
//
// --explore  only runs each scene's setup and saves an ARIA snapshot + screenshot per scene
// --tag      marks the shots as "before" or "after"; compose.mjs puts each before next to its after
// --seed     runs seed.mjs with the shot list's `fixtures` first

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnv, parseArgs } from './lib/env.mjs'
import { adminAuth, ocs, pool, userAuth } from './lib/http.mjs'
import { createNc, ensureLogin, launchBrowser } from './lib/nc.mjs'

const started = Date.now()
const args = parseArgs(process.argv.slice(2))
const shotsFile = path.resolve(args._[0] ?? '')
if (!args._[0] || !fs.existsSync(shotsFile)) {
	console.error('Usage: node run.mjs <shots.mjs> [--out dir] [--only a,b] [--workers 4] [--explore] [--tag before|after] [--seed]')
	process.exit(2)
}
const config = (await import(pathToFileURL(shotsFile).href)).default
const outDir = path.resolve(args.out ?? path.join(path.dirname(shotsFile), 'out'))
fs.mkdirSync(outDir, { recursive: true })
const tag = typeof args.tag === 'string' ? args.tag : undefined
const only = typeof args.only === 'string' ? args.only.split(',') : undefined

if (args.seed && config.fixtures) {
	execFileSync(process.execPath, [path.join(import.meta.dirname, 'seed.mjs'), '--fixtures', config.fixtures], { stdio: 'inherit' })
}

const env = loadEnv()
const scenes = config.scenes.map((s, index) => ({ ...s, index, name: s.name ?? s.section ?? `scene-${index}` }))
	.filter((s) => !only || only.includes(s.name))

// Light and dark only need prefers-color-scheme; other themes and languages are user settings
// on the server, so scenes are grouped by them and each setting is applied once.
const CLIENT_THEMES = ['light', 'dark']
const SERVER_THEMES = { highcontrast: 'light-highcontrast', 'dark-highcontrast': 'dark-highcontrast', dyslexia: 'opendyslexic' }
const jobs = []
for (const scene of scenes) {
	const themes = scene.themes ?? ['light']
	const client = themes.filter((t) => CLIENT_THEMES.includes(t))
	if (client.length) {
		jobs.push({ scene, themes: client, theme: undefined, lang: scene.lang })
	}
	for (const t of themes.filter((t) => !CLIENT_THEMES.includes(t))) {
		if (!SERVER_THEMES[t]) {
			throw new Error(`Unknown theme "${t}" in scene "${scene.name}". Use: ${[...CLIENT_THEMES, ...Object.keys(SERVER_THEMES)].join(', ')}`)
		}
		jobs.push({ scene, themes: [t], theme: t, lang: scene.lang })
	}
}
const groups = new Map()
for (const job of jobs) {
	const key = `${job.theme ?? ''}|${job.lang ?? ''}`
	groups.set(key, [...(groups.get(key) ?? []), job])
}

async function applyUserSettings({ theme, lang }) {
	if (theme) {
		await ocs(env, userAuth(env), 'PUT', `/apps/theming/api/v1/theme/${SERVER_THEMES[theme]}/enable`)
	}
	if (lang) {
		await ocs(env, adminAuth(env), 'PUT', `/cloud/users/${encodeURIComponent(env.user.id)}`, { key: 'language', value: lang })
	}
}
async function resetUserSettings({ theme, lang }) {
	if (theme) {
		await ocs(env, userAuth(env), 'DELETE', `/apps/theming/api/v1/theme/${SERVER_THEMES[theme]}`)
	}
	if (lang) {
		await ocs(env, adminAuth(env), 'PUT', `/cloud/users/${encodeURIComponent(env.user.id)}`, { key: 'language', value: 'en' })
	}
}

const browser = await launchBrowser(env)
const storageState = await ensureLogin(browser, env)
const entries = []
const failures = []
const explored = []

async function runJob(job) {
	const { scene } = job
	// Jobs of one scene (one per server theme) number their shots in job order
	const seqBase = jobs.filter((j) => j.scene === scene).indexOf(job) * 100
	const nc = await createNc({ browser, env, storageState, scene, outDir, clock: config.clock, seqBase, record: (e) => entries.push({ ...e, name: scene.name, tag }) })
	try {
		await nc.setColorScheme(job.themes[0])
		await scene.setup?.(nc)
		if (args.explore) {
			explored.push(await nc.explore(job.theme ? `${scene.name}-${job.theme}` : scene.name))
			return
		}
		const viewports = scene.viewports ?? ['desktop']
		for (const [i, vp] of viewports.entries()) {
			if (i > 0) {
				await nc.setViewport(vp)
				// Resizing an open view can leave layout a real user at that width never sees,
				// so set it up again unless the scene says resizing in place is fine
				if (scene.keepOnResize) {
					await scene.resize?.(nc)
				} else {
					await scene.setup?.(nc)
				}
			}
			for (const theme of job.themes) {
				await nc.setColorScheme(theme)
				await scene.capture(nc)
			}
		}
	} catch (e) {
		const shot = path.join(outDir, `error-${scene.name.replace(/[^a-z0-9]+/gi, '-')}.png`)
		await nc.page.screenshot({ path: shot }).catch(() => {})
		failures.push(`${scene.name}: ${e.message.split('\n')[0]}\n      screenshot of the failure: ${shot}`)
	} finally {
		await nc.close()
	}
}

const workers = Number(args.workers ?? 4)
for (const [key, groupJobs] of groups) {
	const [theme, lang] = key.split('|')
	const settings = { theme: theme || undefined, lang: lang || undefined }
	await applyUserSettings(settings)
	try {
		// Scenes that change server state run alone, after the others
		await pool(groupJobs.filter((j) => !j.scene.exclusive), runJob, workers)
		for (const job of groupJobs.filter((j) => j.scene.exclusive)) {
			await runJob(job)
		}
	} finally {
		await resetUserSettings(settings)
	}
}
await browser.close()

if (args.explore) {
	console.log('Explore output (read the .aria.yml for selectors, the .png to see the state):')
	explored.forEach((p) => console.log(`  ${p}.aria.yml / .png`))
} else {
	// Merge into the manifest: replace only what this run produced
	const manifestFile = path.join(outDir, 'manifest.json')
	let previous = []
	try {
		previous = JSON.parse(fs.readFileSync(manifestFile, 'utf8')).entries
	} catch {}
	const ran = new Set(scenes.map((s) => s.name))
	const kept = previous.filter((e) => !(ran.has(e.name) && e.tag === tag))
	const all = [...kept, ...entries].sort((a, b) => a.scene - b.scene || (a.tag === 'before' ? -1 : 0) - (b.tag === 'before' ? -1 : 0) || a.seq - b.seq)
	fs.writeFileSync(manifestFile, JSON.stringify({ shotsFile, entries: all }, null, '\t'))
	console.log(`${entries.length} shot(s) in ${outDir} (${((Date.now() - started) / 1000).toFixed(1)} s)`)
	entries.forEach((e) => console.log(`  ${e.file}  — ${e.section} / ${e.label}${e.tag ? ` [${e.tag}]` : ''}`))
}
if (failures.length) {
	console.log(`\n${failures.length} scene(s) failed:`)
	failures.forEach((f) => console.log(`  ${f}`))
	process.exit(1)
}
