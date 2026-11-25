#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Check the instance, the repo's build and the browser, install Playwright if needed, cache the result.
// Usage: node preflight.mjs [--app-dir .]   (instance from NC_URL, default http://nextcloud.local)

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { CACHE_DIR, importPlaywright, loadEnv, parseArgs, saveEnv } from './lib/env.mjs'
import { adminAuth, ocs } from './lib/http.mjs'

const repo = path.resolve(parseArgs(process.argv.slice(2))['app-dir'] ?? '.')
const env = loadEnv()
const ok = (msg) => console.log(`ok    ${msg}`)
const warn = (msg) => console.log(`warn  ${msg}`)
function fail(msg) {
	console.log(`FAIL  ${msg}`)
	process.exit(1)
}

if (Number(process.versions.node.split('.')[0]) < 22) {
	fail(`these scripts need Node 22 or newer, this is ${process.version}`)
}

const status = await fetch(`${env.url}/status.php`).then((r) => r.json()).catch(() => fail(`${env.url} is not reachable; start it or set NC_URL`))
if (!status.installed || status.maintenance) {
	fail('instance is not installed or in maintenance mode')
}
env.prefix = (await fetch(`${env.url}/login`, { redirect: 'manual' })).status === 200 ? '' : '/index.php'
ok(`${env.url} (${status.versionstring})${env.prefix ? ', no pretty URLs' : ''}`)

if ((await ocs(env, adminAuth(env), 'GET', '/cloud/user')).status !== 200) {
	fail(`admin login as "${env.admin.user}" failed; set NC_ADMIN_USER and NC_ADMIN_PASS`)
}

// Build: apps build src/ into js/ or dist/, the server builds core/src and apps/*/src into dist/
const pkgFile = path.join(repo, 'package.json')
if (fs.existsSync(pkgFile)) {
	const wanted = JSON.parse(fs.readFileSync(pkgFile, 'utf8')).engines?.node?.match(/\d+/)?.[0]
	if (wanted && wanted !== process.versions.node.split('.')[0]) {
		warn(`the repo wants Node ${wanted}, this is ${process.version}; build with that version (nvm use ${wanted})`)
	}
	const newest = (dir) => fs.existsSync(dir)
		? Math.max(0, ...fs.readdirSync(dir, { recursive: true }).map((f) => fs.statSync(path.join(dir, f)).mtimeMs))
		: 0
	const isServer = fs.existsSync(path.join(repo, 'version.php'))
	const sources = isServer ? ['core/src', ...fs.readdirSync(path.join(repo, 'apps')).map((a) => `apps/${a}/src`)] : ['src']
	const built = Math.max(newest(path.join(repo, 'js')), newest(path.join(repo, 'dist')))
	if (Math.max(...sources.map((s) => newest(path.join(repo, s)))) > built) {
		warn('the build is missing or older than the sources; run npm ci && npm run build')
	} else {
		ok('build is up to date')
	}
}

// Keep Playwright current: install the latest version when it is missing or a month old
const bin = path.join(CACHE_DIR, 'node_modules', '.bin', 'playwright')
const lock = path.join(CACHE_DIR, 'package-lock.json')
if (!fs.existsSync(bin) || !fs.existsSync(lock) || Date.now() - fs.statSync(lock).mtimeMs > 30 * 86400000) {
	execFileSync('npm', ['install', '--prefix', CACHE_DIR, '--no-audit', '--no-fund', 'playwright@latest'], { stdio: 'inherit' })
	fs.utimesSync(lock, new Date(), new Date())
}
// No-op when the matching browser is already installed
execFileSync(bin, ['install', 'chromium'], { stdio: 'inherit' })
const browser = await (await importPlaywright()).chromium.launch()
const res = await (await browser.newPage()).goto(`${env.url}/status.php`).catch(() => null)
await browser.close()
if (!res?.ok()) {
	fail(`the browser can't reach ${env.url}`)
}
ok('browser reaches the instance')

saveEnv(env)
