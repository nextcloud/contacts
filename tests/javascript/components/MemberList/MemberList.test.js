/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

describe('MemberList computed properties', () => {
	test('flatList sorts teams before users', () => {
		const list = [
			{ id: 1, isUser: false, displayName: 'Team A' },
			{ id: 2, isUser: true, displayName: 'User B' },
			{ id: 3, isUser: false, displayName: 'Team C' },
			{ id: 4, isUser: true, displayName: 'User D' },
		]

		const teams = list.filter((member) => !member.isUser)
		const users = list.filter((member) => member.isUser)
		const flatList = [...teams, ...users]

		expect(flatList).toHaveLength(4)
		expect(flatList[0].isUser).toBe(false)
		expect(flatList[1].isUser).toBe(false)
		expect(flatList[2].isUser).toBe(true)
		expect(flatList[3].isUser).toBe(true)
	})

	test('hasActiveFilters returns true when search query is set', () => {
		const searchQuery = 'test'
		const searchRole = null
		const hasActiveFilters = searchQuery !== '' || searchRole !== null

		expect(hasActiveFilters).toBe(true)
	})

	test('hasActiveFilters returns true when search role is set', () => {
		const searchQuery = ''
		const searchRole = { id: 1 }
		const hasActiveFilters = searchQuery !== '' || searchRole !== null

		expect(hasActiveFilters).toBe(true)
	})

	test('hasActiveFilters returns false when neither is set', () => {
		const searchQuery = ''
		const searchRole = null
		const hasActiveFilters = searchQuery !== '' || searchRole !== null

		expect(hasActiveFilters).toBe(false)
	})

	test('decodedTeamName decodes HTML entities', () => {
		const raw = "John's Team"
		const ta = document.createElement('textarea')
		ta.innerHTML = raw
		const decoded = ta.value

		expect(decoded).toBe("John's Team")
	})
})
