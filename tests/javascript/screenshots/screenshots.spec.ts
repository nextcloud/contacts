/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { type APIRequestContext, type Page, type PlaywrightWorkerArgs, expect, test } from '@playwright/test'
import { statSync } from 'node:fs'
import { login } from '../e2e/login.js'
import { demoContacts, toVCard } from './demoContacts.js'

const ADMIN_USER = process.env.NC_ADMIN_USER ?? 'admin'
const ADMIN_PASSWORD = process.env.NC_ADMIN_PASSWORD ?? 'admin'
const DEMO_USER = 'jane'
const DEMO_PASSWORD = 'Screenshots-Demo-2026!'
const DEMO_DISPLAY_NAME = 'Jane Cooper'

// The App Store rejects screenshots larger than 2 MiB
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024

/**
 * Delete and recreate the demo user so every run starts from the same state.
 *
 * @param request API request context authenticated as an admin
 */
async function resetDemoUser(request: APIRequestContext): Promise<void> {
	const headers = { 'OCS-APIRequest': 'true', Accept: 'application/json' }
	await request.delete(`./ocs/v2.php/cloud/users/${DEMO_USER}`, { headers })
	const created = await request.post('./ocs/v2.php/cloud/users', {
		headers,
		form: { userid: DEMO_USER, password: DEMO_PASSWORD, displayName: DEMO_DISPLAY_NAME },
	})
	expect(created.ok(), await created.text()).toBeTruthy()

	for (const [key, value] of [['language', 'en'], ['locale', 'en_US']]) {
		const edited = await request.put(`./ocs/v2.php/cloud/users/${DEMO_USER}`, { headers, form: { key, value } })
		expect(edited.ok(), await edited.text()).toBeTruthy()
	}
}

/**
 * Fill the demo user's default address book with the demo contacts only.
 *
 * @param request API request context authenticated as the demo user
 */
async function seedContacts(request: APIRequestContext): Promise<void> {
	const addressBook = `./remote.php/dav/addressbooks/users/${DEMO_USER}/contacts`

	// Listing the address book home creates the default address book of a new user
	const listing = await request.fetch(`./remote.php/dav/addressbooks/users/${DEMO_USER}/`, {
		method: 'PROPFIND',
		headers: { Depth: '1' },
	})
	expect(listing.status(), await listing.text()).toBe(207)

	for (const contact of demoContacts) {
		const response = await request.put(`${addressBook}/${contact.uid}.vcf`, {
			headers: { 'Content-Type': 'text/vcard; charset=utf-8' },
			data: toVCard(contact),
		})
		expect(response.status(), `${contact.uid}: ${await response.text()}`).toBe(201)
	}

	// Drop anything else, e.g. the example contact the server adds on first login
	const cards = await request.fetch(`${addressBook}/`, {
		method: 'PROPFIND',
		headers: { Depth: '1' },
	})
	const demoFiles = new Set(demoContacts.map((contact) => `${contact.uid}.vcf`))
	const hrefs = [...(await cards.text()).matchAll(/<d:href>([^<]+)<\/d:href>/g)]
		.map((match) => match[1])
		.filter((href) => !href.endsWith('/') && !demoFiles.has(decodeURIComponent(href.split('/').pop()!)))
	for (const href of hrefs) {
		const deleted = await request.delete(href)
		expect(deleted.ok(), `${href}: ${await deleted.text()}`).toBeTruthy()
	}
}

/**
 * Save a screenshot of the current page into ./screenshots.
 *
 * @param page The page to capture
 * @param name The file name without extension
 */
async function capture(page: Page, name: string): Promise<void> {
	// Let transitions and lazy avatars settle
	await page.waitForLoadState('networkidle')
	await page.mouse.move(0, 0)
	const path = `screenshots/${name}.png`
	await page.screenshot({ path, animations: 'disabled', caret: 'hide' })
	expect(statSync(path).size).toBeLessThanOrEqual(MAX_SCREENSHOT_BYTES)
}

/**
 * Pan and zoom the org chart like a user would, so that every visible node fits the view.
 *
 * @param page The page showing the org chart
 */
async function fitOrgChart(page: Page): Promise<void> {
	const view = (await page.locator('.org-chart__container').boundingBox())!
	const viewCenter = { x: view.x + view.width / 2, y: view.y + view.height / 2 }

	// Each pass pans and zooms around the view center; a second pass corrects rounding of the first
	for (let pass = 0; pass < 2; pass++) {
		const rects = await page.locator('.org-chart-node').evaluateAll((elements) => elements.map((element) => {
			const { left, top, right, bottom } = element.getBoundingClientRect()
			return { left, top, right, bottom }
		}))
		const left = Math.min(...rects.map((rect) => rect.left))
		const top = Math.min(...rects.map((rect) => rect.top))
		const right = Math.max(...rects.map((rect) => rect.right))
		const bottom = Math.max(...rects.map((rect) => rect.bottom))

		// Drag the chart so the center of the nodes moves to the center of the view
		await page.mouse.move(viewCenter.x, viewCenter.y)
		await page.mouse.down()
		await page.mouse.move(2 * viewCenter.x - (left + right) / 2, 2 * viewCenter.y - (top + bottom) / 2, { steps: 10 })
		await page.mouse.up()

		// d3-zoom scales by 2^(-deltaY / 500) per wheel event in pixel mode
		const scale = Math.min(view.width / (right - left), view.height / (bottom - top)) * 0.85
		await page.mouse.move(viewCenter.x, viewCenter.y)
		await page.mouse.wheel(0, -500 * Math.log2(scale))
		// Wait for the zoom transition
		await page.waitForTimeout(1000)
	}
}

/**
 * Create an API request context authenticated with basic auth. Each user needs its own
 * context: the session cookie set by the server would otherwise take precedence.
 *
 * @param playwright The Playwright instance
 * @param baseURL The server URL
 * @param username The login name
 * @param password The password
 */
function apiContext(playwright: PlaywrightWorkerArgs['playwright'], baseURL: string | undefined, username: string, password: string): Promise<APIRequestContext> {
	return playwright.request.newContext({
		baseURL,
		ignoreHTTPSErrors: true,
		httpCredentials: { username, password, send: 'always' },
	})
}

test.beforeAll(async ({ playwright, browser, baseURL }) => {
	const admin = await apiContext(playwright, baseURL, ADMIN_USER, ADMIN_PASSWORD)
	await resetDemoUser(admin)
	await admin.dispose()

	// The first web login provisions the user's default content, so it has to happen before seeding
	const page = await browser.newPage()
	await login(page, DEMO_USER, DEMO_PASSWORD)
	await page.close()

	const demo = await apiContext(playwright, baseURL, DEMO_USER, DEMO_PASSWORD)
	await seedContacts(demo)
	await demo.dispose()
})

test.beforeEach(async ({ page }) => {
	await login(page, DEMO_USER, DEMO_PASSWORD)
	await page.goto('./index.php/apps/contacts')
	await expect(page.getByText('Amelia Hart').first()).toBeVisible()
})

test('contact details', async ({ page }) => {
	await page.getByText('Amelia Hart').first().click()
	await expect(page.locator('#app-content-vue').getByRole('heading', { name: 'Amelia Hart' })).toBeVisible()
	await capture(page, 'contacts')
})

test('organization chart', async ({ page }) => {
	await page.getByRole('link', { name: 'Organization chart' }).click()
	await expect(page.locator('.org-chart-node').filter({ hasText: 'Amelia Hart' })).toBeVisible()
	for (const manager of ['Noah Fischer', 'Sofia Rossi']) {
		await page.locator('g.node').filter({ hasText: manager }).locator('.node-button-g').click()
		// Wait for the expand transition of the chart
		await page.waitForTimeout(1000)
	}
	await expect(page.locator('.org-chart-node').filter({ hasText: 'Chloé Dubois' })).toBeVisible()
	await fitOrgChart(page)
	await capture(page, 'organization-chart')
})
