/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Browser session and the `nc` helper object handed to every scene of a shot list

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { CACHE_DIR, importPlaywright, VIEWPORTS } from './env.mjs'
import { dav, ocs, userAuth } from './http.mjs'

const STABILIZE_CSS = `
*, *::before, *::after { transition: none !important; animation-duration: 0s !important; animation-delay: 0s !important; caret-color: transparent !important; }
[id^="profiler"], .profiler-toolbar, #firstrunwizard, .first-run-wizard { display: none !important; }
`
const HIDE_TOASTS_CSS = '.toastify { display: none !important; }'

export async function launchBrowser(env) {
	const { chromium } = await importPlaywright()
	const args = env.hostResolverRule ? [`--host-resolver-rules=${env.hostResolverRule}`] : []
	return chromium.launch({ args, ...(env.chromePath ? { executablePath: env.chromePath } : {}) })
}

/**
 * Log in once and reuse the session for every context and run, so there is no repeated
 * login (and no brute-force throttling)
 *
 * @return {Promise<string>} path of the storage state file
 */
export async function ensureLogin(browser, env) {
	const key = crypto.createHash('sha1').update(`${env.url}|${env.user.id}|${env.user.password}`).digest('hex').slice(0, 12)
	const file = path.join(CACHE_DIR, `session-${key}.json`)
	if (fs.existsSync(file)) {
		const ctx = await browser.newContext({ storageState: file })
		const res = await ctx.request.get(`${env.url}/ocs/v2.php/cloud/user?format=json`, { headers: { 'OCS-APIRequest': 'true' } })
		await ctx.close()
		if (res.status() === 200) {
			return file
		}
	}
	const ctx = await browser.newContext()
	const page = await ctx.newPage()
	await page.goto(`${env.url}${env.prefix}/login`, { waitUntil: 'domcontentloaded' })
	await page.fill('#user', env.user.id)
	await page.fill('#password', env.user.password)
	await page.click('button[type=submit]')
	await page.waitForURL((url) => !url.pathname.endsWith('/login'), { waitUntil: 'domcontentloaded', timeout: 60000 })
	if (page.url().includes('/login')) {
		throw new Error(`Login as ${env.user.id} failed. Run seed.mjs to (re)create the test user.`)
	}
	// Dismiss the first-run wizard for good, if the app is installed
	await page.evaluate(async () => {
		try {
			await fetch(window.OC.generateUrl('/apps/firstrunwizard/wizard'), { method: 'DELETE', headers: { requesttoken: window.OC.requestToken } })
		} catch {}
	})
	fs.mkdirSync(CACHE_DIR, { recursive: true })
	await ctx.storageState({ path: file })
	await ctx.close()
	return file
}

/**
 * Create the `nc` object for one scene: a page plus helpers
 *
 * @param {object} opts options
 * @param {object} opts.browser Playwright browser
 * @param {object} opts.env from loadEnv()
 * @param {string} opts.storageState session file from ensureLogin()
 * @param {object} opts.scene the scene from the shot list
 * @param {Function} opts.record called with each manifest entry
 * @param {string} opts.outDir where PNGs go
 * @param {string} [opts.clock] fixed Date, e.g. 2026-03-02T10:00:00Z
 */
export async function createNc({ browser, env, storageState, scene, record, outDir, clock, seqBase = 0 }) {
	const viewports = scene.viewports ?? ['desktop']
	const themes = scene.themes ?? ['light']
	const ctx = await browser.newContext({
		storageState,
		viewport: VIEWPORTS[viewports[0]] ?? viewports[0],
		colorScheme: 'light',
		reducedMotion: 'reduce',
	})
	await ctx.addInitScript(({ css }) => {
		const add = () => {
			const style = document.createElement('style')
			style.dataset.ncShots = ''
			style.textContent = css
			document.head.append(style)
		}
		if (document.head) {
			add()
		} else {
			document.addEventListener('DOMContentLoaded', add)
		}
	}, { css: STABILIZE_CSS + (scene.toasts ? '' : HIDE_TOASTS_CSS) })
	const page = await ctx.newPage()
	if (clock) {
		await page.clock.setFixedTime(new Date(clock))
	}

	// Requests in flight, to wait for XHR/fetch after the page has loaded (Playwright's
	// "networkidle" only covers navigations). Requests held by delay() don't count.
	const inflight = new Map()
	let held = 0
	page.on('request', (r) => inflight.set(r, Date.now()))
	page.on('requestfinished', (r) => inflight.delete(r))
	page.on('requestfailed', (r) => inflight.delete(r))
	async function networkQuiet(timeout, quietMs = 300) {
		const end = Date.now() + timeout
		let quietSince = Date.now()
		while (Date.now() < end) {
			// Ignore long-polling requests that never finish
			const pending = [...inflight.values()].filter((t) => Date.now() - t < 15000).length - held
			if (pending > 0) {
				quietSince = Date.now()
			} else if (Date.now() - quietSince >= quietMs) {
				return
			}
			await new Promise((r) => setTimeout(r, 50))
		}
	}

	let seq = seqBase
	const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

	const nc = {
		page,
		env,
		viewport: viewports[0],
		theme: themes[0],

		/** Open an app page and wait until it has settled */
		async open(app, sub = '') {
			await page.goto(`${env.url}${env.prefix}/apps/${app}${sub}`, { waitUntil: 'domcontentloaded' })
			await nc.ready()
		},

		/** Wait for the network to go quiet, loading indicators to disappear and fonts to load */
		async ready({ timeout = 10000 } = {}) {
			await networkQuiet(timeout)
			// While delay() holds requests, the loading indicators are what we want to capture
			await (held > 0
				? Promise.resolve()
				: page.waitForFunction(() => ![...document.querySelectorAll('.icon-loading, .icon-loading-small, .loading-icon, [aria-busy="true"]')]
						.some((el) => el.offsetParent !== null), undefined, { timeout }).catch(() => {}))
			await page.evaluate(() => document.fonts.ready)
			await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
		},

		/** Open the app navigation if it is collapsed (mobile / tablet) */
		async openNavigation() {
			const toggle = page.getByRole('button', { name: 'Open navigation' })
			if (await toggle.isVisible().catch(() => false)) {
				await toggle.click()
				await page.locator('.app-navigation').first().waitFor({ state: 'visible' })
				await nc.ready()
			}
		},

		/** Open the app's settings dialog from the navigation footer */
		async openAppSettings() {
			await nc.openNavigation()
			await page.locator('.app-navigation').getByRole('button', { name: /settings/i }).last().click()
			await page.getByRole('dialog').first().waitFor()
			await nc.ready()
		},

		/**
		 * Hold matching requests until the returned release() is called (loading states).
		 * release() waits until the page has settled again.
		 */
		async delay(pattern) {
			let open
			const gate = new Promise((r) => { open = r })
			const continued = []
			await page.route(pattern, (route) => {
				held++
				const done = gate.then(() => route.continue()).catch(() => {}).finally(() => { held-- })
				continued.push(done)
				return done
			})
			return async () => {
				open()
				// Unrouting before the held requests continue would make them fail
				await Promise.all(continued)
				await page.unroute(pattern)
				await nc.ready()
			}
		},

		/** Make matching requests fail (error states) */
		async fail(pattern, status = 500) {
			await page.route(pattern, (route) => route.fulfill({ status, body: '' }))
			return () => page.unroute(pattern)
		},

		/** Show toasts again for this scene (they are hidden by default) */
		async showToasts() {
			await page.addStyleTag({ content: '.toastify { display: flex !important; }' })
		},

		/**
		 * Take a screenshot and add it to the manifest
		 *
		 * @param {string} label caption under the section header
		 * @param {object} [o] options
		 * @param {string|object} [o.target] selector or locator to crop to; default the viewport
		 * @param {boolean} [o.all] crop to all visible matches of target together (e.g. list items)
		 * @param {number} [o.pad] pixels around the target
		 * @param {boolean} [o.fullPage] whole scrollable page
		 * @param {number} [o.scale] 2 for a close-up
		 */
		async shot(label, { target, all = false, pad = 8, fullPage = false, scale = 1 } = {}) {
			await nc.ready()
			const parts = [label]
			if (viewports.length > 1) { parts.push(nc.viewport) }
			if (themes.length > 1) { parts.push(nc.theme) }
			const fullLabel = parts.join(' · ')
			const file = `${String(scene.index).padStart(2, '0')}-${String(seq).padStart(2, '0')}-${slug(fullLabel)}.png`
			const opts = { path: path.join(outDir, file), fullPage }
			if (target) {
				const loc = typeof target === 'string' ? page.locator(target) : target
				await loc.first().waitFor({ state: 'visible' })
				const boxes = (await Promise.all((all ? await loc.all() : [loc.first()]).map((l) => l.boundingBox())))
					.filter((b) => b && b.width > 0 && b.height > 0)
				const box = {
					x: Math.min(...boxes.map((b) => b.x)),
					y: Math.min(...boxes.map((b) => b.y)),
				}
				box.width = Math.max(...boxes.map((b) => b.x + b.width)) - box.x
				box.height = Math.max(...boxes.map((b) => b.y + b.height)) - box.y
				const vp = page.viewportSize()
				const x = Math.max(0, box.x - pad)
				const y = Math.max(0, box.y - pad)
				opts.clip = { x, y, width: Math.min(vp.width - x, box.width + 2 * pad), height: Math.min(vp.height - y, box.height + 2 * pad) }
			}
			if (scale !== 1) {
				await withScale(page, scale, () => page.screenshot(opts))
			} else {
				await page.screenshot(opts)
			}
			record({ scene: scene.index, seq: seq++, section: scene.section ?? scene.name, label: fullLabel, file, scale })
		},

		/** A 2x crop of one element, labeled "Close-up" by default */
		closeup(target, label = 'Close-up', o = {}) {
			return nc.shot(label, { target, pad: 16, scale: 2, ...o })
		},

		/** Save an ARIA snapshot and a screenshot of the current page, to pick selectors from */
		async explore(name = scene.name) {
			const dir = path.join(outDir, 'explore')
			fs.mkdirSync(dir, { recursive: true })
			await nc.ready()
			fs.writeFileSync(path.join(dir, `${slug(name)}.aria.yml`), await page.locator('body').ariaSnapshot())
			await page.screenshot({ path: path.join(dir, `${slug(name)}.png`) })
			return path.join(dir, slug(name))
		},

		/** OCS / DAV calls as the test user, e.g. to set an app preference before a shot */
		ocs: (method, p, body) => ocs(env, userAuth(env), method, p, body),
		dav: (method, p, body, headers) => dav(env, userAuth(env), method, p, body, headers),

		async setViewport(name) {
			nc.viewport = name
			await page.setViewportSize(VIEWPORTS[name] ?? name)
			await nc.ready()
		},

		async setColorScheme(theme) {
			nc.theme = theme
			await page.emulateMedia({ colorScheme: theme.startsWith('dark') ? 'dark' : 'light' })
			await nc.ready()
		},

		close: () => ctx.close(),
	}
	return nc
}

/**
 * Temporarily render at a higher device scale factor without a new context or reload
 */
async function withScale(page, scale, fn) {
	const cdp = await page.context().newCDPSession(page)
	const vp = page.viewportSize()
	await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: scale, mobile: false })
	try {
		await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
		return await fn()
	} finally {
		await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: false })
		await cdp.detach()
		await page.setViewportSize(vp)
	}
}
