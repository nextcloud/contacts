/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/vue', () => ({ NcButton: {} }), { virtual: true })
jest.mock('@nextcloud/vue/components/NcFormBox', () => ({}), { virtual: true })
jest.mock('@nextcloud/router', () => ({
	generateOcsUrl: (path) => `/ocs${path}`,
}), { virtual: true })
jest.mock('@nextcloud/dialogs', () => ({ showError: jest.fn() }), { virtual: true })
jest.mock('vue-material-design-icons/ArrowDown.vue', () => ({}))
jest.mock('vue-material-design-icons/ArrowUp.vue', () => ({}))
jest.mock('../../../src/services/logger.js', () => ({ __esModule: true, default: { error: jest.fn() } }))

// eslint-disable-next-line import/first
import axios from '@nextcloud/axios'
// eslint-disable-next-line import/first
import { showError } from '@nextcloud/dialogs'
// eslint-disable-next-line import/first
import SettingsSubtitleOrder from '../../../src/components/AppNavigation/Settings/SettingsSubtitleOrder.vue'

const { move, keepFocus } = SettingsSubtitleOrder.methods

/**
 * Build the component instance the methods run on, with a store holding the given order
 *
 * @param {string[]} order the stored order
 * @return {object}
 */
function component(order) {
	const self = {
		saving: false,
		buttons: {},
		$nextTick: () => Promise.resolve(),
		keepFocus: jest.fn(),
		$store: {
			commit: jest.fn((mutation, newOrder) => {
				self.order = newOrder
			}),
		},
		order,
	}
	return self
}

describe('SettingsSubtitleOrder', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('moving a field up saves the new order', async () => {
		axios.put.mockResolvedValue({})
		const self = component(['org', 'email', 'tel'])

		await move.call(self, 2, -1)

		expect(self.order).toEqual(['org', 'tel', 'email'])
		expect(axios.put).toHaveBeenCalledWith('/ocs/apps/contacts/api/v1/settings/subtitle-order', { order: ['org', 'tel', 'email'] })
		expect(self.saving).toBe(false)
	})

	test('moving a field down saves the new order', async () => {
		axios.put.mockResolvedValue({})
		const self = component(['org', 'email', 'tel'])

		await move.call(self, 0, 1)

		expect(self.order).toEqual(['email', 'org', 'tel'])
	})

	test('a failed save puts the old order back', async () => {
		axios.put.mockRejectedValue(new Error('offline'))
		const self = component(['org', 'email', 'tel'])

		await move.call(self, 2, -1)

		expect(self.order).toEqual(['org', 'email', 'tel'])
		expect(showError).toHaveBeenCalled()
	})

	test.each([
		['moved up, not yet at the top', ['org', 'tel', 'email'], -1, 'tel-up'],
		['moved up to the top', ['tel', 'org', 'email'], -1, 'tel-down'],
		['moved down, not yet at the bottom', ['org', 'tel', 'email'], 1, 'tel-down'],
		['moved down to the bottom', ['org', 'email', 'tel'], 1, 'tel-up'],
	])('the focus stays on a button of the moved field when %s', (_, order, offset, expectedButton) => {
		const focused = []
		const buttons = Object.fromEntries(['tel-up', 'tel-down'].map((key) => [key, { $el: { focus: () => focused.push(key) } }]))

		keepFocus.call({ order, buttons }, 'tel', offset)

		expect(focused).toEqual([expectedButton])
	})
})
