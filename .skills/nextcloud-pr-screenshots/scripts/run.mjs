#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Run a shot list; writes PNGs and manifest.json to <shots dir>/out for compose.mjs.
// Usage: node run.mjs <shots.mjs> [--seed] [--explore] [--tag before|after] [--workers 4]

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnv, parseArgs } from './lib/env.mjs'
import { adminAuth, ocs, pool, userAuth } from './lib/http.mjs'
import { createNc, ensureLogin, launchBrowser } from './lib/nc.mjs'

const args = parseArgs(process.argv.slice(2))
const shotsFile = path.resolve(args._[0] ?? '')
if (!fs.existsSync(shotsFile) || !shotsFile.endsWith('.mjs')) {
	console.error('Usage: node run.mjs <shots.mjs> [--seed] [--explore] [--tag before|after] [--workers 4]')
	process.exit(2)
}
const config = (await import(pathToFileURL(shotsFile).href)).default
const outDir = path.join(path.dirname(shotsFile), 'out')
const tag = typeof args.tag === 'string' ? args.tag : undefined
fs.mkdirSync(outDir, { recursive: true })

if (args.seed) {
	execFileSync(process.execPath, [path.join(import.meta.dirname, 'seed.mjs'), ...(config.fixtures ? ['--fixtures', config.fixtures] : [])], { stdio: 'inherit' })
}
const env = loadEnv()

// light/dark only need prefers-color-scheme; the other themes and the language are user settings,
// so jobs are grouped by them and each group's setting is applied once
const SERVER_THEMES = { highcontrast: 'light-highcontrast', 'dark-highcontrast': 'dark-highcontrast', dyslexia: 'opendyslexic' }
const jobs = config.scenes.flatMap((s, index) => {
	const scene = { ...s, index, name: s.name ?? s.section ?? `scene-${index}` }
	const themes = scene.themes ?? ['light']
	const client = themes.filter((t) => !SERVER_THEMES[t])
	return [
		...(client.length ? [{ scene, themes: client }] : []),
		...themes.filter((t) => SERVER_THEMES[t]).map((t) => ({ scene, themes: [t], serverTheme: t })),
	].map((job, i) => ({ ...job, lang: scene.lang, seqBase: i * 100 }))
})

async function setUserSettings({ serverTheme, lang }, on) {
	const calls = []
	if (serverTheme) {
		calls.push(ocs(env, userAuth(env), on ? 'PUT' : 'DELETE', `/apps/theming/api/v1/theme/${SERVER_THEMES[serverTheme]}${on ? '/enable' : ''}`))
	}
	if (lang) {
		calls.push(ocs(env, adminAuth(env), 'PUT', `/cloud/users/${encodeURIComponent(env.user.id)}`, { key: 'language', value: on ? lang : 'en' }))
	}
	if ((await Promise.all(calls)).some((r) => r.status !== 200)) {
		throw new Error(`Could not ${on ? 'apply' : 'reset'} ${[serverTheme, lang].filter(Boolean).join(' / ')}`)
	}
}

const browser = await launchBrowser()
const storageState = await ensureLogin(browser, env)
const entries = []
const failures = []

async function runJob({ scene, themes, seqBase }) {
	let nc
	try {
		nc = await createNc({ browser, env, storageState, scene, outDir, tag, clock: config.clock, record: (e) => entries.push({ ...e, seq: e.seq + seqBase }) })
		await nc.setTheme(themes[0])
		await scene.setup?.(nc)
		if (args.explore) {
			console.log(`  ${await nc.explore(`${scene.name} ${themes[0]}`)}.aria.yml / .png`)
			return
		}
		for (const [i, viewport] of (scene.viewports ?? ['desktop']).entries()) {
			if (i > 0) {
				await nc.setViewport(viewport)
				// A view resized while open can differ from what a user at that width sees
				await (scene.keepOnResize ? scene.resize?.(nc) : scene.setup?.(nc))
			}
			for (const theme of themes) {
				await nc.setTheme(theme)
				await scene.capture(nc)
			}
		}
	} catch (e) {
		const shot = path.join(outDir, `error-${scene.index}.png`)
		await nc?.page.screenshot({ path: shot }).catch(() => {})
		failures.push(`${scene.name}: ${String(e?.message ?? e).split('\n')[0]} (see ${shot})`)
	} finally {
		await nc?.close()
	}
}

if (!args.explore) {
	// A tagged run replaces the shots with its tag; an untagged run replaces everything
	fs.readdirSync(outDir).filter((f) => f.endsWith('.png') && (!tag || f.startsWith(`${tag}-`) || f.startsWith('error-')))
		.forEach((f) => fs.rmSync(path.join(outDir, f)))
}
const groups = Map.groupBy(jobs, (j) => `${j.serverTheme ?? ''}|${j.lang ?? ''}`)
for (const group of groups.values()) {
	try {
		await setUserSettings(group[0], true)
	} catch (e) {
		group.forEach((j) => failures.push(`${j.scene.name}: ${e.message}`))
		continue
	}
	// Scenes that change server state run alone, after the others
	await pool(group.filter((j) => !j.scene.exclusive), runJob, Number(args.workers ?? 4))
	for (const job of group.filter((j) => j.scene.exclusive)) {
		await runJob(job)
	}
	await setUserSettings(group[0], false).catch((e) => failures.push(e.message))
}
await browser.close()

if (!args.explore) {
	const manifestFile = path.join(outDir, 'manifest.json')
	const kept = tag && fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')).filter((e) => e.tag && e.tag !== tag) : []
	const all = [...kept, ...entries].sort((a, b) => a.scene - b.scene || a.seq - b.seq || (a.tag === 'before' ? -1 : 1))
	fs.writeFileSync(manifestFile, JSON.stringify(all, null, '\t'))
	console.log(`${entries.length} shot(s) in ${outDir}`)
}
if (failures.length) {
	console.log(`${failures.length} failure(s):\n  ${failures.join('\n  ')}`)
	process.exit(1)
}
