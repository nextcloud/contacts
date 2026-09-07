/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// The store index has to be imported first to avoid a circular import issue
import store from '../../../src/store/index.js'
import Contact from '../../../src/models/contact.js'

const addressbook = { id: 'ab1', displayName: 'Address book', enabled: true, contacts: {} }

function contact(fullName) {
	const c = new Contact(`BEGIN:VCARD
VERSION:4.0
FN:${fullName}
END:VCARD`, addressbook)
	return c
}

function contactWithUid(uid, fullName) {
	return new Contact(`BEGIN:VCARD
VERSION:4.0
UID:${uid}
FN:${fullName}
END:VCARD`, addressbook)
}

function contactWithRev(fullName, rev) {
	return new Contact(`BEGIN:VCARD
VERSION:3.0
FN:${fullName}
REV:${rev}
END:VCARD`, addressbook)
}

describe('addContact mutation keeps every contact in the sorted list', () => {
	beforeEach(() => {
		store.state.contacts.contacts = {}
		store.state.contacts.sortedContacts.splice(0)
	})

	const keys = () => store.state.contacts.sortedContacts.map((c) => c.value)

	test('into an empty list', () => {
		store.commit('addContact', contact('Name'))
		expect(keys()).toEqual(['Name'])
	})

	test('when it sorts after the only existing contact', () => {
		store.commit('addContact', contact('Alice'))
		store.commit('addContact', contact('Name'))
		expect(keys()).toEqual(['Alice', 'Name'])
	})

	test('when it sorts before the only existing contact', () => {
		store.commit('addContact', contact('Zoe'))
		store.commit('addContact', contact('Name'))
		expect(keys()).toEqual(['Name', 'Zoe'])
	})

	// The reported regression: the only contacts in the store are account
	// contacts from another address book, all sorting after the new contact's
	// default name, and the new contact never made it into the index.
	// https://github.com/nextcloud/contacts/issues/5681
	test('when every existing contact sorts before it', () => {
		for (let i = 0; i < 300; i++) {
			store.commit('addContact', contact(`User00${700 + i} John (elysee)`))
		}

		const created = contact('Nom')
		store.commit('addContact', created)

		expect(store.getters.getSortedContacts.findIndex((c) => c.key === created.key)).toBe(0)
	})

	test('favorites stay on top', () => {
		const favorite = contact('Zoe')
		favorite.dav = { favorite: true }
		store.commit('addContact', contact('Alice'))
		store.commit('addContact', favorite)
		store.commit('addContact', contact('Name'))
		expect(keys()).toEqual(['Zoe', 'Alice', 'Name'])
	})

	test('when it sorts in the middle', () => {
		store.commit('addContact', contact('Alice'))
		store.commit('addContact', contact('Zoe'))
		store.commit('addContact', contact('Name'))
		expect(keys()).toEqual(['Alice', 'Name', 'Zoe'])
	})
})

describe('sorting on other order keys', () => {
	beforeEach(() => {
		store.state.contacts.contacts = {}
		store.state.contacts.sortedContacts.splice(0)
		store.commit('setOrder', 'displayName')
	})

	const keys = () => store.state.contacts.sortedContacts.map((c) => c.key)

	test('contacts without a value come last', () => {
		store.commit('addContact', contact('Alice'))
		const nameless = contact('')
		store.commit('addContact', nameless)
		store.commit('addContact', contact('Zoe'))
		expect(keys()[2]).toBe(nameless.key)

		store.commit('sortContacts')
		expect(keys()[2]).toBe(nameless.key)
	})

	test('a structured name with multiple given names', () => {
		store.commit('setOrder', 'firstName')
		const multiple = new Contact(`BEGIN:VCARD
VERSION:4.0
FN:Peter Parker
N:Parker;Peter,Pete;;;
END:VCARD`, addressbook)

		const alice = contact('Alice')
		store.commit('addContact', multiple)
		store.commit('addContact', alice)
		store.commit('sortContacts')

		expect(keys()).toEqual([alice.key, multiple.key])
	})

	test('last modified sorts the most recent first', () => {
		store.commit('setOrder', 'rev')
		const older = contactWithRev('Alice', '20200101T000000Z')
		const newer = contactWithRev('Zoe', '20260101T000000Z')

		store.commit('addContact', older)
		store.commit('addContact', newer)
		expect(keys()).toEqual([newer.key, older.key])

		// contacts fetched from the server end up in reactive state,
		// where ical.js cannot read its own internals anymore
		store.commit('appendContacts', [older, newer])
		store.commit('sortContacts')
		expect(keys()).toEqual([newer.key, older.key])
	})

	test('a contact with an unparsable value does not break the sort', () => {
		store.commit('setOrder', 'rev')
		const broken = contactWithRev('Alice', 'not a date')
		const valid = contactWithRev('Zoe', '20260101T000000Z')

		store.commit('appendContacts', [broken, valid])
		store.commit('sortContacts')

		expect(keys()).toEqual([valid.key, broken.key])
	})

	test('a rev that decodes to a plain string does not break the sort', () => {
		store.commit('setOrder', 'rev')
		const text = new Contact(`BEGIN:VCARD
VERSION:4.0
FN:Alice
REV;VALUE=TEXT:garbage
END:VCARD`, addressbook)
		const valid = contactWithRev('Zoe', '20260101T000000Z')

		store.commit('addContact', valid)
		store.commit('addContact', text)

		expect(keys()).toEqual([valid.key, text.key])
		expect(store.state.contacts.contacts[text.key]).toBeDefined()
	})

	test('a text rev does not break the order of the dated revisions', () => {
		store.commit('setOrder', 'rev')
		const older = contactWithRev('Alice', '20200101T000000Z')
		const newer = contactWithRev('Zoe', '20260101T000000Z')
		// lexically this sits between the two timestamps, which used to make the comparator
		// non-transitive and left the dated revisions out of order
		const text = new Contact(`BEGIN:VCARD
VERSION:4.0
FN:Bob
REV;VALUE=TEXT:1700
END:VCARD`, addressbook)

		store.commit('addContact', older)
		store.commit('addContact', text)
		store.commit('addContact', newer)
		expect(keys()).toEqual([newer.key, older.key, text.key])

		store.commit('appendContacts', [older, text, newer])
		store.commit('sortContacts')
		expect(keys()).toEqual([newer.key, older.key, text.key])
	})
})

describe('mutations that re-sort an existing contact', () => {
	const otherAddressbook = { id: 'ab2', displayName: 'Other address book', enabled: true, contacts: {} }

	beforeEach(() => {
		store.state.contacts.contacts = {}
		store.state.contacts.sortedContacts.splice(0)
		store.commit('setOrder', 'displayName')
	})

	const names = () => store.state.contacts.sortedContacts.map((c) => c.value)

	test('updateContact moves a renamed contact', () => {
		store.commit('addContact', contact('Bob'))
		store.commit('addContact', contactWithUid('uid1', 'Alice'))
		expect(names()).toEqual(['Alice', 'Bob'])

		store.commit('updateContact', contactWithUid('uid1', 'Zoe'))
		expect(names()).toEqual(['Bob', 'Zoe'])
	})

	test('updateContact leaves the order alone when nothing sortable changed', () => {
		store.commit('addContact', contact('Alice'))
		store.commit('addContact', contactWithUid('uid1', 'Bob'))
		const before = [...store.state.contacts.sortedContacts]

		store.commit('updateContact', contactWithUid('uid1', 'Bob'))
		expect(store.state.contacts.sortedContacts).toEqual(before)
	})

	test('updateContactFavorite moves a contact in and out of the favorites', () => {
		const zoe = contact('Zoe')
		zoe.dav = { favorite: false }
		store.commit('addContact', contact('Alice'))
		store.commit('addContact', zoe)
		expect(names()).toEqual(['Alice', 'Zoe'])

		zoe.dav.favorite = true
		store.commit('updateContactFavorite', zoe)
		expect(names()).toEqual(['Zoe', 'Alice'])

		zoe.dav.favorite = false
		store.commit('updateContactFavorite', zoe)
		expect(names()).toEqual(['Alice', 'Zoe'])
	})

	test('updateContactAddressbook re-keys the entry at the same position', () => {
		store.commit('addContact', contact('Alice'))
		const moved = contact('Bob')
		store.commit('addContact', moved)
		store.commit('addContact', contact('Zoe'))

		const oldKey = moved.key
		store.commit('updateContactAddressbook', { contact: moved, addressbook: otherAddressbook })

		expect(moved.key).not.toBe(oldKey)
		expect(names()).toEqual(['Alice', 'Bob', 'Zoe'])
		expect(store.state.contacts.sortedContacts[1].key).toBe(moved.key)
	})

	// the same contact copied into two address books shares its uid and name,
	// so the address book part of the key is what orders them
	test('updateContactAddressbook re-sorts when the new key orders differently', () => {
		const thirdAddressbook = { id: 'ab3', displayName: 'Third address book', enabled: true, contacts: {} }
		const moved = new Contact(`BEGIN:VCARD
VERSION:4.0
UID:john
FN:John
END:VCARD`, addressbook)
		const copy = new Contact(`BEGIN:VCARD
VERSION:4.0
UID:john
FN:John
END:VCARD`, otherAddressbook)

		store.commit('addContact', moved)
		store.commit('addContact', copy)
		expect(store.state.contacts.sortedContacts.map((c) => c.key)).toEqual([moved.key, copy.key])

		store.commit('updateContactAddressbook', { contact: moved, addressbook: thirdAddressbook })

		expect(store.state.contacts.sortedContacts.map((c) => c.key)).toEqual([copy.key, moved.key])
	})

	// appendContacts fills the contacts map without indexing them
	test('updateContactAddressbook ignores a contact that is not indexed yet', () => {
		const unindexed = contact('Alice')
		store.commit('appendContacts', [unindexed])

		store.commit('updateContactAddressbook', { contact: unindexed, addressbook: otherAddressbook })
		expect(names()).toEqual([])
	})

	test('deleteContact leaves the index alone when the contact is not indexed', () => {
		store.commit('addContact', contact('Alice'))
		store.commit('addContact', contact('Zoe'))
		const unindexed = contactWithUid('unindexed', 'Bob')
		store.commit('appendContacts', [unindexed])

		store.commit('deleteContact', unindexed)
		expect(names()).toEqual(['Alice', 'Zoe'])
	})
})
