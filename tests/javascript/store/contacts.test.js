/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Contact from '../../../src/models/contact.js'
import contactsStore from '../../../src/store/contacts.js'

const addressbook = { id: 'default' }

function createContact(displayName, uid, favorite = false) {
	const contact = new Contact(`
		BEGIN:VCARD
		VERSION:4.0
		UID:${uid}
		FN:${displayName}
		END:VCARD`.replace(/\t/gm, ''), addressbook)
	contact.dav = { favorite }
	return contact
}

describe('contacts store', () => {
	let state

	beforeEach(() => {
		state = {
			contacts: {},
			sortedContacts: [],
			orderKey: 'displayName',
		}
	})

	test('inserts a contact before all existing contacts', () => {
		const nextcloudy = createContact('Nextcloudy McCloudface', 'nextcloudy')
		const name = createContact('Name', 'name')
		contactsStore.mutations.addContact(state, nextcloudy)

		contactsStore.mutations.addContact(state, name)

		expect(state.sortedContacts.map(({ key }) => key)).toEqual([
			name.key,
			nextcloudy.key,
		])
	})

	test('inserts a contact between existing contacts', () => {
		const aaron = createContact('Aaron', 'aaron')
		const nextcloudy = createContact('Nextcloudy McCloudface', 'nextcloudy')
		const name = createContact('Name', 'name')
		contactsStore.mutations.addContact(state, aaron)
		contactsStore.mutations.addContact(state, nextcloudy)

		contactsStore.mutations.addContact(state, name)

		expect(state.sortedContacts.map(({ key }) => key)).toEqual([
			aaron.key,
			name.key,
			nextcloudy.key,
		])
	})

	test('inserts a contact after all existing contacts', () => {
		const name = createContact('Name', 'name')
		const nextcloudy = createContact('Nextcloudy McCloudface', 'nextcloudy')
		contactsStore.mutations.addContact(state, name)

		contactsStore.mutations.addContact(state, nextcloudy)

		expect(state.sortedContacts.map(({ key }) => key)).toEqual([
			name.key,
			nextcloudy.key,
		])
	})

	test('inserts favorite contacts before non-favorite contacts', () => {
		const aaron = createContact('Aaron', 'aaron')
		const zebra = createContact('Zebra', 'zebra', true)
		contactsStore.mutations.addContact(state, aaron)

		contactsStore.mutations.addContact(state, zebra)

		expect(state.sortedContacts.map(({ key }) => key)).toEqual([
			zebra.key,
			aaron.key,
		])
	})
})
