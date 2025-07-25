/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { test, expect } from '@playwright/test'
import { login } from './login.js'

test.beforeEach(async ({ page }) => {
	await login(page)
})

test('create a contact', async ({ page }) => {
	await page.goto('./index.php/apps/contacts')

	const firstName = Math.random().toString(16).slice(2, 10)
	const lastName = Math.random().toString(16).slice(2, 10)
	const name = `${firstName} ${lastName}`

	// Create new contact with random title
	await page.getByRole('button', { name: 'New contact' }).click()
	await page.getByRole('textbox', { name: 'Name' }).click()
	await page.getByRole('textbox', { name: 'Name' }).fill(name)
	await page.getByRole('button', { name: 'Save' }).click()

	// Assert that the contact exists and was saved
	await expect(page.getByTestId('contacts-list').getByRole('group')).toContainText(name)
})
