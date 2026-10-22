/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/l10n', () => ({
	translate: (app, text, vars = {}) => text.replace(/{(\w+)}/g, (match, name) => String(vars[name] ?? match)),
}))

import { contactsCounterProps } from '../../../src/utils/counterUtils.js'

describe('contactsCounterProps', () => {
	test('shows the plain count when every contact is loaded', () => {
		expect(contactsCounterProps(42, false)).toEqual({ count: 42 })
	})

	test('adds a plus sign when more contacts remain to be loaded', () => {
		expect(contactsCounterProps(100, true)).toEqual({ count: '100+', raw: true })
	})
})
