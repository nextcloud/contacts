/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { CACHE_DIR, importPlaywright, VIEWPORTS } from './env.mjs'
import { dav, ocs, userAuth } from './http.mjs'

// Selectors that depend on Nextcloud's markup (@nextcloud/vue, @nextcloud/dialogs, server).
// They must not depend on the UI language. Update them here when the libraries change.
const SEL = {
	toast: '.toastify',
	loading: '.icon-loading, .icon-loading-small, .loading-icon, [aria-busy="true"]',
	navigation: '.app-navigation',
	navigationToggle: '.app-navigation-toggle[aria-expanded="false"]',
	dialog: '[role="dialog"]',
}
const STABLE_CSS = `*, *::before, *::after { transition: none !important; animation-duration: 0s !important; animation-delay: 0s !important; caret-color: transparent !important; }
[id^="profiler"] { display: none !important; }`
const NO_TOASTS_CSS = `${SEL.toast} { display: none !important; }`

export async function launchBrowser() {
	return (await importPlaywright()).chromium.launch()
}

/**
 * Log in once and cache the session, so runs don't log in again (and don't trigger brute-force throttling)
 *
 * @return {Promise<string>} storage state file
 */
export async function ensureLogin(browser, env) {
	if ((await ocs(env, userAuth(env), 'GET', '/cloud/user')).status !== 200) {
		throw new Error(`Can't log in as ${env.user.id}; run seed.mjs first`)
	}
	const key = crypto.createHash('sha1').update(`${env.url}|${env.user.id}|${env.user.password}`).digest('hex').slice(0, 12)
	const file = path.join(CACHE_DIR, `session-${key}.json`)
	if (fs.existsSync(file)) {
		const ctx = await browser.newContext({ storageState: file })
		const res = await ctx.request.get(`${env.url}/ocs/v2.php/cloud/user`, { headers: { 'OCS-APIRequest': 'true' } })
		await ctx.close()
		if (res.ok()) {
			return file
		}
	}
	const ctx = await browser.newContext()
	const page = await ctx.newPage()
	await page.goto(`${env.url}${env.prefix}/login`)
	await page.fill('#user', env.user.id)
	await page.fill('#password', env.user.password)
	await page.click('button[type=submit]')
	await page.waitForURL((url) => !url.pathname.endsWith('/login'))
	await ctx.storageState({ path: file })
	await ctx.close()
	return file
}

/**
 * The `nc` object a scene works with: one page plus helpers. See templates/shots.example.mjs.
 */
export async function createNc({ browser, env, storageState, scene, outDir, tag, clock, record }) {
	const viewports = scene.viewports ?? ['desktop']
	const themes = scene.themes ?? ['light']
	const ctx = await browser.newContext({ storageState, viewport: VIEWPORTS[viewports[0]], reducedMotion: 'reduce' })
	await ctx.addInitScript((css) => {
		document.addEventListener('DOMContentLoaded', () => document.head.append(Object.assign(document.createElement('style'), { textContent: css })))
	}, STABLE_CSS + (scene.toasts ? '' : NO_TOASTS_CSS))
	const page = await ctx.newPage()
	if (clock) {
		await page.clock.setFixedTime(new Date(clock))
	}

	// Playwright's "networkidle" only covers page loads, so track XHR/fetch ourselves.
	// Requests held by delay() don't count, and neither do long polls.
	const inflight = new Map()
	let held = 0
	page.on('request', (r) => inflight.set(r, Date.now()))
	page.on('requestfinished', (r) => inflight.delete(r))
	page.on('requestfailed', (r) => inflight.delete(r))
	async function networkQuiet(timeout) {
		const end = Date.now() + timeout
		let quietSince = Date.now()
		while (Date.now() < end && Date.now() - quietSince < 300) {
			if ([...inflight.values()].filter((t) => Date.now() - t < 15000).length > held) {
				quietSince = Date.now()
			}
			await new Promise((r) => setTimeout(r, 50))
		}
	}

	let seq = 0
	const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

	const nc = {
		page,
		viewport: viewports[0],
		theme: themes[0],

		async open(app, sub = '') {
			await page.goto(`${env.url}${env.prefix}/apps/${app}${sub}`)
			await nc.ready()
		},

		/** Wait for requests to finish, loading indicators to go away and fonts to load */
		async ready(timeout = 10000) {
			await networkQuiet(timeout)
			if (held === 0) {
				await page.waitForFunction((sel) => ![...document.querySelectorAll(sel)].some((el) => el.offsetParent), SEL.loading, { timeout }).catch(() => {})
			}
			await page.evaluate(() => document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))))
		},

		async openNavigation() {
			const toggle = page.locator(SEL.navigationToggle)
			if (await toggle.isVisible()) {
				await toggle.click()
				await nc.ready()
			}
		},

		/** Click the bottom-most entry of the app navigation, where apps put their settings */
		async openAppSettings() {
			await nc.openNavigation()
			const buttons = page.locator(`${SEL.navigation} :is(button, a, [role="button"]):visible`)
			const bottoms = await buttons.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().bottom))
			await buttons.nth(bottoms.indexOf(Math.max(...bottoms))).click()
			await page.locator(SEL.dialog).first().waitFor()
			await nc.ready()
		},

		/** Hold matching requests until the returned function is called, for loading states */
		async delay(glob) {
			const { promise: gate, resolve: open } = Promise.withResolvers()
			const pending = []
			await page.route(glob, (route) => {
				held++
				const done = gate.then(() => route.continue()).catch(() => {}).finally(() => held--)
				pending.push(done)
				return done
			})
			return async () => {
				open()
				// Unrouting before the held requests have continued makes them fail
				await Promise.all(pending)
				await page.unroute(glob)
				await nc.ready()
			}
		},

		async fail(glob, status = 500) {
			await page.route(glob, (route) => route.fulfill({ status, body: '' }))
		},

		/**
		 * @param {string} label caption in the composite
		 * @param {object} [o] options
		 * @param {string|object} [o.target] selector or locator to crop to, default the viewport
		 * @param {boolean} [o.all] crop to all matches of target together
		 * @param {number} [o.pad] margin around the target
		 * @param {number} [o.scale] device scale factor, 2 for close-ups
		 */
		async shot(label, { target, all = false, pad = 8, fullPage = false, scale = 1 } = {}) {
			await nc.ready()
			const fullLabel = [label, viewports.length > 1 && nc.viewport, themes.length > 1 && nc.theme].filter(Boolean).join(' · ')
			const file = `${tag ?? 'shot'}-${String(scene.index).padStart(2, '0')}-${String(seq).padStart(2, '0')}-${slug(fullLabel)}.png`
			const opts = { path: path.join(outDir, file), fullPage }
			if (target) {
				const loc = typeof target === 'string' ? page.locator(target) : target
				await loc.first().scrollIntoViewIfNeeded()
				const boxes = (await Promise.all((all ? await loc.all() : [loc.first()]).map((l) => l.boundingBox()))).filter(Boolean)
				const vp = page.viewportSize()
				const x = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad)
				const y = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad)
				opts.clip = {
					x,
					y,
					width: Math.min(vp.width, Math.max(...boxes.map((b) => b.x + b.width)) + pad) - x,
					height: Math.min(vp.height, Math.max(...boxes.map((b) => b.y + b.height)) + pad) - y,
				}
			}
			await withScale(page, scale, () => page.screenshot(opts))
			record({ scene: scene.index, seq: seq++, section: scene.section ?? scene.name, label: fullLabel, file, tag })
		},

		closeup(target, label = 'Close-up', o = {}) {
			return nc.shot(label, { target, pad: 16, scale: 2, ...o })
		},

		/** Save an ARIA snapshot and a screenshot of the page, to pick selectors from */
		async explore(name) {
			const base = path.join(outDir, 'explore', slug(name))
			fs.mkdirSync(path.dirname(base), { recursive: true })
			await nc.ready()
			fs.writeFileSync(`${base}.aria.yml`, await page.locator('body').ariaSnapshot())
			await page.screenshot({ path: `${base}.png` })
			return base
		},

		ocs: (method, p, body) => ocs(env, userAuth(env), method, p, body),
		dav: (method, p, body, headers) => dav(env, userAuth(env), method, p, body, headers),

		async setViewport(name) {
			nc.viewport = name
			await page.setViewportSize(VIEWPORTS[name])
		},

		async setTheme(theme) {
			nc.theme = theme
			await page.emulateMedia({ colorScheme: theme.startsWith('dark') ? 'dark' : 'light' })
		},

		close: () => ctx.close(),
	}
	return nc
}

/**
 * Render at another device scale factor without a new context or a reload
 */
async function withScale(page, scale, fn) {
	if (scale === 1) {
		return fn()
	}
	const cdp = await page.context().newCDPSession(page)
	const vp = page.viewportSize()
	await cdp.send('Emulation.setDeviceMetricsOverride', { ...vp, deviceScaleFactor: scale, mobile: false })
	try {
		return await fn()
	} finally {
		await cdp.detach()
		await page.setViewportSize(vp)
	}
}
