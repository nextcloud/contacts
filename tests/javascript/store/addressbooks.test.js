/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { sortAddressbooks } from '../../../src/utils/addressbookUtils.js'
import usePrincipalsStore from '../../../src/store/principals.js'
import { setActivePinia, createPinia } from 'pinia'

/**
 * Test suite for sortAddressbooks function
 */
describe('addressbooks', () => {
	let addressbooks

	beforeEach(() => {
		addressbooks = [
			{ id: 'ab1', owner: 'current', readOnly: false, disabled: false, contacts: { '1': {}, '2': {} } },
			{ id: 'ab2', owner: 'current', readOnly: false, disabled: false, contacts: { '1': {} } },
			{ id: 'ab3', owner: 'other', readOnly: false, disabled: false, contacts: { '1': {}, '2': {}, '3': {} } },
			{ id: 'ab4', owner: 'other', readOnly: true, disabled: false, contacts: { '1': {} } },
			{ id: 'ab5', owner: 'current', readOnly: true, disabled: false, contacts: { '1': {}, '2': {}, '3': {}, '4': {} } },
			{ id: 'ab6', owner: 'other', readOnly: false, disabled: true, contacts: { '1': {} } },
		]

		setActivePinia(createPinia())

		const principalsStore = usePrincipalsStore()
		principalsStore.currentUserPrincipal = {
			url: 'current',
		}
	})

	test('sorts addressbooks by priority groups', () => {
		const sorted = sortAddressbooks(addressbooks)

		const ids = sorted.map(ab => ab.id)

		// My addressbooks should come first (ab1, ab2)
		expect(ids.indexOf('ab1')).toBeLessThan(ids.indexOf('ab3'))
		expect(ids.indexOf('ab2')).toBeLessThan(ids.indexOf('ab3'))

		// Shared writeable should come before read-only
		expect(ids.indexOf('ab3')).toBeLessThan(ids.indexOf('ab4'))
	})

	test('sorts by contact count within same group', () => {
		const currentUserUrl = 'current'
		const sorted = sortAddressbooks(addressbooks)

		// In "my addressbooks" group, ab1 has 2 contacts, ab2 has 1
		const myAddressbooks = sorted.filter(ab =>
			ab.owner === currentUserUrl && !ab.readOnly && !ab.disabled
		)
		expect(myAddressbooks[0].id).toBe('ab1') // More contacts
		expect(myAddressbooks[1].id).toBe('ab2') // Fewer contacts
	})

	test('sorts alphabetically by ID when contact counts are equal', () => {
		const addressbooksWithSameCount = [
			{ id: 'zebra', owner: 'current', readOnly: false, disabled: false, contacts: { '1': {} } },
			{ id: 'alpha', owner: 'current', readOnly: false, disabled: false, contacts: { '1': {} } },
		]

		const sorted = sortAddressbooks(addressbooksWithSameCount)
		expect(sorted[0].id).toBe('alpha')
		expect(sorted[1].id).toBe('zebra')
	})
})
