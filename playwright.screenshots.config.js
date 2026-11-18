/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { defineConfig, devices } from '@playwright/test'

/**
 * Generates the App Store screenshots in ./screenshots.
 * Run with `npm run screenshots` against a Nextcloud server with the app enabled.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: './tests/javascript/screenshots',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	workers: 1,
	reporter: [['list']],
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'https://localhost',
		...devices['Desktop Chrome'],
		ignoreHTTPSErrors: true,
		viewport: { width: 1440, height: 900 },
		deviceScaleFactor: 2,
		colorScheme: 'light',
		locale: 'en-US',
		timezoneId: 'Europe/Berlin',
	},
})
