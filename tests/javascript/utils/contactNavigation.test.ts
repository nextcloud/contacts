/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getNextContactKey, getPreviousContactKey } from '../../../src/utils/contactNavigation'

const list = [
	{ key: 'alice' },
	{ key: 'bob' },
	{ key: 'charlie' },
]

describe('getPreviousContactKey', () => {
	test('returns the key of the preceding contact', () => {
		expect(getPreviousContactKey(list, 'bob')).toBe('alice')
		expect(getPreviousContactKey(list, 'charlie')).toBe('bob')
	})

	test('returns null when the selected contact is first', () => {
		expect(getPreviousContactKey(list, 'alice')).toBeNull()
	})

	test('returns null when the selected contact is not in the list', () => {
		expect(getPreviousContactKey(list, 'unknown')).toBeNull()
	})

	test('returns null for an empty list', () => {
		expect(getPreviousContactKey([], 'alice')).toBeNull()
	})
})

describe('getNextContactKey', () => {
	test('returns the key of the following contact', () => {
		expect(getNextContactKey(list, 'alice')).toBe('bob')
		expect(getNextContactKey(list, 'bob')).toBe('charlie')
	})

	test('returns null when the selected contact is last', () => {
		expect(getNextContactKey(list, 'charlie')).toBeNull()
	})

	test('returns null when the selected contact is not in the list', () => {
		expect(getNextContactKey(list, 'unknown')).toBeNull()
	})

	test('returns null for an empty list', () => {
		expect(getNextContactKey([], 'alice')).toBeNull()
	})
})
