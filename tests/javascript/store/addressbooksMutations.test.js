/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { computed } from 'vue'
// The store index has to be imported first to avoid a circular import issue
import store from '../../../src/store/index.js'

describe('addressbooks mutations', () => {
	beforeEach(() => {
		store.state.addressbooks.addressbooks.splice(0)
		store.commit('addAddressbook', {
			id: 'ab1',
			displayName: 'Address book',
			enabled: true,
			url: '/remote.php/dav/addressbooks/users/admin/ab1/',
		})
	})

	test('toggleAddressbookEnabled updates the reactive state', () => {
		const addressbook = store.getters.getAddressbooks[0]
		const enabled = computed(() => addressbook.enabled)
		expect(enabled.value).toBe(true)

		store.commit('toggleAddressbookEnabled', addressbook)

		expect(addressbook.enabled).toBe(false)
		// the change has to be picked up by reactive consumers, e.g. the settings dialog
		expect(enabled.value).toBe(false)
	})

	test('renameAddressbook updates the reactive state', () => {
		const addressbook = store.getters.getAddressbooks[0]
		const displayName = computed(() => addressbook.displayName)
		expect(displayName.value).toBe('Address book')

		store.commit('renameAddressbook', { addressbook, newName: 'Renamed' })

		expect(addressbook.displayName).toBe('Renamed')
		expect(displayName.value).toBe('Renamed')
	})
})
