/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/l10n', () => ({ getLanguage: () => 'en' }))
jest.mock('@nextcloud/vue', () => ({ NcButton: {}, NcModal: {}, NcProgressBar: {} }), { virtual: true })
jest.mock('vue-material-design-icons/TrayArrowUp.vue', () => ({}))
jest.mock('../../../src/components/AppNavigation/Settings/ImportScreenRow.vue', () => ({}))

// eslint-disable-next-line import/first
import ImportScreen from '../../../src/components/AppNavigation/Settings/ImportScreen.vue'

/**
 * Compute the status line for the given counters.
 *
 * @param {object} overrides counters to override
 * @return {string}
 */
function getStatusLine(overrides = {}) {
	const totals = {
		discovered: 0,
		processed: 0,
		created: 0,
		updated: 0,
		exists: 0,
		error: 0,
		...overrides,
	}
	return ImportScreen.computed.statusLine.call({ totals })
}

describe('ImportScreen.statusLine', () => {
	const originalN = global.n

	beforeEach(() => {
		global.n = (app, singular, plural, count, vars = {}) => {
			const text = (count === 1 ? singular : plural).replace('%n', count)
			return text.replace(/{(\w+)}/g, (match, key) => vars[key] ?? match)
		}
	})

	afterEach(() => {
		global.n = originalN
	})

	test('is empty when nothing was discovered yet', () => {
		expect(getStatusLine()).toBe('')
	})

	test('shows the progress even when nothing was processed yet', () => {
		expect(getStatusLine({ discovered: 100 })).toBe('Processing 0 of 100')
	})

	test('lists only the counters that are not zero', () => {
		expect(getStatusLine({ discovered: 100, processed: 30, created: 25, updated: 5 }))
			.toBe('Processing 30 of 100, Created 25, Updated 5')
	})

	test('lists all counters when none are zero', () => {
		expect(getStatusLine({ discovered: 10, processed: 10, created: 4, updated: 3, exists: 2, error: 1 }))
			.toBe('Processing 10 of 10, Created 4, Updated 3, Skipped 2, Failed 1')
	})
})
