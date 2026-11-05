/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { type Page } from '@playwright/test'

/**
 * Log in as the given user, the admin by default.
 * This method is best used in a beforeEach hook.
 *
 * @param page The page object to use
 * @param user The login name
 * @param password The password
 */
export async function login(page: Page, user = 'admin', password = 'admin'): Promise<void> {
	await page.goto('./index.php/login')
	await page.locator('#user').fill(user)
	await page.locator('#password').fill(password)
	await page.locator('#password').press('Enter')

	// Wait for login to finish
	await page.waitForURL('**/apps/**', { waitUntil: 'domcontentloaded' })
}
