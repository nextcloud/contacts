#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Check everything a capture needs, fix what can be fixed, and cache the result.
// Usage: node preflight.mjs [--url http://nextcloud.local] [--app-dir .]
// Prints one line per check; exits 1 with a hint on the first problem it can't fix.

import { execFileSync } from 'node:child_process'
import dns from 'node:dns/promises'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { CACHE_DIR, importPlaywright, loadEnv, parseArgs, saveEnv } from './lib/env.mjs'
import { adminAuth, ocs } from './lib/http.mjs'

const PLAYWRIGHT_VERSION = '1.56.1'
const args = parseArgs(process.argv.slice(2))
if (args.url) {
	process.env.NC_URL = args.url
}
const env = loadEnv()
const appDir = path.resolve(args['app-dir'] ?? process.cwd())
const warnings = []

const ok = (msg) => console.log(`ok    ${msg}`)
function warn(msg) { warnings.push(msg); console.log(`warn  ${msg}`) }
function fail(msg, hint) {
	console.log(`FAIL  ${msg}`)
	if (hint) {
		console.log(`      → ${hint}`)
	}
	process.exit(1)
}

// Instance
let status
try {
	status = await (await fetch(`${env.url}/status.php`)).json()
} catch (e) {
	fail(`${env.url}/status.php is not reachable (${e.cause?.code ?? e.message})`, 'Start the instance or pass --url / set NC_URL')
}
if (!status.installed || status.maintenance) {
	fail(`Instance is ${status.installed ? 'in maintenance mode' : 'not installed'}`)
}
ok(`instance ${env.url} (${status.versionstring})`)

// Pretty URLs
const pretty = await fetch(`${env.url}/login`, { redirect: 'manual' })
env.prefix = pretty.status === 200 ? '' : '/index.php'
ok(env.prefix ? 'no pretty URLs, using /index.php/…' : 'pretty URLs work')

// Admin credentials (needed to create the test user)
const me = await ocs(env, adminAuth(env), 'GET', `/cloud/users/${encodeURIComponent(env.admin.user)}`)
if (me.status !== 200) {
	fail(`admin login as "${env.admin.user}" failed (HTTP ${me.status})`, 'Set NC_ADMIN_USER and NC_ADMIN_PASS')
}
ok(`admin credentials (${env.admin.user})`)

// Repo under test: an app (appinfo/info.xml) or the server itself (version.php + core/)
const infoXml = path.join(appDir, 'appinfo', 'info.xml')
const isServer = fs.existsSync(path.join(appDir, 'version.php')) && fs.existsSync(path.join(appDir, 'core'))
if (fs.existsSync(infoXml)) {
	const appId = fs.readFileSync(infoXml, 'utf8').match(/<id>([^<]+)<\/id>/)?.[1]
	const enabled = await ocs(env, adminAuth(env), 'GET', '/cloud/apps?filter=enabled')
	if (appId && enabled.data?.apps && !enabled.data.apps.includes(appId)) {
		warn(`app "${appId}" is not enabled on the instance`)
	} else {
		ok(`app "${appId}" enabled`)
	}
} else if (isServer) {
	ok('server repo')
} else {
	warn(`${appDir} is neither a Nextcloud app nor the server repo; skipping build checks (pass --app-dir)`)
}

if ((fs.existsSync(infoXml) || isServer) && fs.existsSync(path.join(appDir, 'package.json'))) {
	const pkg = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf8'))
	const wantMajor = pkg.engines?.node?.match(/\d+/)?.[0]
	const haveMajor = process.versions.node.split('.')[0]
	if (wantMajor && wantMajor !== haveMajor) {
		warn(`repo wants Node ${pkg.engines.node}, this is ${process.version}. Build with: nvm use ${wantMajor}  (or: npx -y node@${wantMajor} …)`)
	} else {
		ok(`node ${process.version}`)
	}

	const newest = (dir) => {
		let max = 0
		const walk = (d) => {
			for (const e of fs.readdirSync(d, { withFileTypes: true })) {
				const p = path.join(d, e.name)
				if (e.isDirectory()) {
					walk(p)
				} else {
					max = Math.max(max, fs.statSync(p).mtimeMs)
				}
			}
		}
		if (fs.existsSync(dir)) {
			walk(dir)
		}
		return max
	}
	// Apps build src/ into js/ or dist/; the server builds core/src and apps/*/src into dist/
	const srcDirs = isServer
		? ['core/src', ...fs.readdirSync(path.join(appDir, 'apps')).map((a) => `apps/${a}/src`)]
		: ['src']
	const outDir = ['js', 'dist'].find((d) => fs.existsSync(path.join(appDir, d)))
	const srcTime = Math.max(...srcDirs.map((d) => newest(path.join(appDir, d))))
	const buildTime = outDir ? newest(path.join(appDir, outDir)) : 0
	if (!buildTime) {
		warn('no build output (js/ or dist/). Run: npm ci && npm run build')
	} else if (srcTime > buildTime) {
		warn(`sources are newer than ${outDir}/. Run: npm run build (or npm run dev for a quicker unminified build)`)
	} else {
		ok('frontend build is up to date')
	}
}

// Playwright and a browser
let pw
try {
	pw = await importPlaywright()
} catch {
	console.log(`…     installing playwright@${PLAYWRIGHT_VERSION} into ${CACHE_DIR}`)
	fs.mkdirSync(CACHE_DIR, { recursive: true })
	execFileSync('npm', ['install', '--prefix', CACHE_DIR, '--no-audit', '--no-fund', `playwright@${PLAYWRIGHT_VERSION}`], { stdio: 'inherit' })
	pw = await importPlaywright()
}

function findCachedChrome() {
	const base = process.env.PLAYWRIGHT_BROWSERS_PATH
		?? (os.platform() === 'darwin' ? path.join(os.homedir(), 'Library/Caches/ms-playwright') : path.join(os.homedir(), '.cache/ms-playwright'))
	if (!fs.existsSync(base)) {
		return undefined
	}
	const rel = {
		linux: ['chrome-linux64/chrome', 'chrome-linux/chrome'],
		darwin: ['chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'],
		win32: ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe'],
	}[os.platform()] ?? []
	return fs.readdirSync(base)
		.filter((d) => /^chromium-\d+$/.test(d))
		.sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
		.flatMap((d) => rel.map((r) => path.join(base, d, r)))
		.find((p) => fs.existsSync(p))
}

async function launch(extraArgs = []) {
	const opts = { args: extraArgs }
	if (env.chromePath) {
		opts.executablePath = env.chromePath
	}
	return pw.chromium.launch(opts)
}

let browser
try {
	browser = await launch()
} catch {
	env.chromePath = findCachedChrome()
	if (env.chromePath) {
		browser = await launch().catch(() => undefined)
	}
	if (!browser) {
		console.log('…     installing Chromium for Playwright')
		execFileSync('npx', ['--prefix', CACHE_DIR, 'playwright', 'install', 'chromium'], { stdio: 'inherit' })
		env.chromePath = undefined
		browser = await launch()
	}
}
ok(`browser ${browser.version()}${env.chromePath ? ' (reused from cache)' : ''}`)

// Does the browser reach the same server as Node?
async function browserSeesInstance(b) {
	const page = await b.newPage()
	try {
		const res = await page.goto(`${env.url}/status.php`, { timeout: 10000 })
		return res?.ok() && (await res.text()).includes('"installed":true')
	} catch {
		return false
	} finally {
		await page.close()
	}
}
env.hostResolverRule = undefined
if (!(await browserSeesInstance(browser))) {
	const host = new URL(env.url).hostname
	const { address } = await dns.lookup(host, { family: 4 })
	const rule = `MAP ${host} ${address}`
	await browser.close()
	browser = await launch([`--host-resolver-rules=${rule}`])
	if (!(await browserSeesInstance(browser))) {
		fail(`the browser can't reach ${env.url}`, 'Check DNS / proxy settings for the browser')
	}
	env.hostResolverRule = rule
	ok(`browser reaches the instance with --host-resolver-rules="${rule}"`)
} else {
	ok('browser reaches the instance')
}
await browser.close()

saveEnv(env)
console.log(`\nSaved to ${path.join(CACHE_DIR, 'env.json')}${warnings.length ? ` — ${warnings.length} warning(s) above` : ''}`)
