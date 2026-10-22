/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// The store index has to be imported first to avoid a circular import issue
import store from '../../../src/store/index.js'
import Contact, { generateContactKey } from '../../../src/models/contact.js'
import client from '../../../src/services/cdav.js'

/**
 * @param {string} uid the contact uid
 * @param {string[]} categories the contact groups
 * @param {string|null} manager the uid of the line manager
 * @return {string} the vCard data
 */
function vcardData(uid, categories = [], manager = null) {
	const lines = ['BEGIN:VCARD', 'VERSION:4.0', `UID:${uid}`]
	if (categories.length > 0) {
		lines.push(`CATEGORIES:${categories.join(',')}`)
	}
	if (manager) {
		lines.push(`X-MANAGERSNAME;UID=${manager}:${manager}`)
	}
	lines.push('END:VCARD')
	return lines.join('\n')
}

/**
 * @param {string} id the address book id
 * @param {Array<[string, string[], string?]>} cards uid, groups and line manager of each card
 * @param {boolean} enabled whether the address book is enabled
 * @return {object} a store address book
 */
function addressbookWith(id, cards, enabled = true) {
	return {
		id,
		enabled,
		contacts: {},
		dav: {
			findAllAndFilterBySimpleProperties: jest.fn().mockResolvedValue(cards.map(([uid, categories, manager]) => ({
				data: vcardData(uid, categories, manager),
				url: `/remote.php/dav/addressbooks/users/admin/${id}/${uid}.vcf`,
			}))),
		},
	}
}

const group = (name) => store.getters.getGroups.find((search) => search.name === name)

beforeEach(() => {
	client.isAddressBookQueryContinuationSupported = jest.fn(() => true)
	store.state.groups.groups.splice(0)
	store.state.groups.addressbooksWithManagers = {}
})

describe('fetchGroupMembers', () => {
	test('builds every group and its members from a UID and CATEGORIES query', async () => {
		const contacts = addressbookWith('contacts', [
			['alice', ['Friends', 'Work']],
			['bob', ['Friends']],
			['carol', []],
		])
		const team = addressbookWith('team', [['dave', ['Work']]])
		const hidden = addressbookWith('hidden', [['erin', ['Hidden']]], false)

		await store.dispatch('fetchGroupMembers', { addressbooks: [contacts, team, hidden] })

		expect(contacts.dav.findAllAndFilterBySimpleProperties).toHaveBeenCalledWith(['UID', 'CATEGORIES', 'X-MANAGERSNAME'])
		expect(hidden.dav.findAllAndFilterBySimpleProperties).not.toHaveBeenCalled()

		expect(store.getters.getGroups.map((search) => search.name).sort()).toEqual(['Friends', 'Work'])
		expect(group('Friends').contacts).toEqual([
			generateContactKey('alice', 'contacts'),
			generateContactKey('bob', 'contacts'),
		])
		expect(group('Work').contacts.sort()).toEqual([
			generateContactKey('alice', 'contacts'),
			generateContactKey('dave', 'team'),
		].sort())
	})

	test('does not count a member twice when its page is loaded too', async () => {
		const contacts = addressbookWith('contacts', [['alice', ['Friends']], ['bob', ['Friends']]])
		await store.dispatch('fetchGroupMembers', { addressbooks: [contacts] })
		await store.dispatch('fetchGroupMembers', { addressbooks: [contacts] })

		store.commit('extractGroupsFromContacts', [new Contact(vcardData('alice', ['Friends']), contacts)])

		expect(group('Friends').contacts).toHaveLength(2)
	})

	test('records which address books have contacts with a line manager', async () => {
		const contacts = addressbookWith('contacts', [['alice', []], ['bob', [], 'alice']])
		const team = addressbookWith('team', [['dave', ['Work']]])

		await store.dispatch('fetchGroupMembers', { addressbooks: [contacts, team] })

		expect(store.getters.getAddressbooksWithManagers).toEqual({ contacts: true, team: false })
	})

	test('keeps going when an address book cannot be queried', async () => {
		const broken = addressbookWith('broken', [])
		broken.dav.findAllAndFilterBySimpleProperties.mockRejectedValue(new Error('500'))
		const contacts = addressbookWith('contacts', [['alice', ['Friends']]])

		await store.dispatch('fetchGroupMembers', { addressbooks: [broken, contacts] })

		expect(group('Friends').contacts).toEqual([generateContactKey('alice', 'contacts')])
	})

	test('does nothing when the server does not page address books', async () => {
		client.isAddressBookQueryContinuationSupported = jest.fn(() => false)
		const contacts = addressbookWith('contacts', [['alice', ['Friends']]])

		await store.dispatch('fetchGroupMembers', { addressbooks: [contacts] })

		expect(contacts.dav.findAllAndFilterBySimpleProperties).not.toHaveBeenCalled()
		expect(store.getters.getGroups).toEqual([])
		expect(store.getters.getAddressbooksWithManagers).toEqual({})
	})
})
