/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Contact from '../../../src/models/contact.js'
import contactsStore from '../../../src/store/contacts.js'

const { mutations } = contactsStore

const buildContact = (vcard) => new Contact(vcard.replace(/\t/gmi, ''), { id: 'addressbook1' })

describe('sortContacts mutation', () => {

	let goodContact
	let brokenRevContact

	beforeEach(() => {
		goodContact = buildContact(`
			BEGIN:VCARD
			VERSION:4.0
			UID:good-contact
			FN:Good contact
			REV:20230911T123456Z
			END:VCARD`)

		// compact REV as written by e.g. Thunderbird CardBook or DAVx5:
		// ical.js throws on any parsed-value access of this property
		brokenRevContact = buildContact(`
			BEGIN:VCARD
			VERSION:4.0
			UID:broken-rev-contact
			FN:Broken rev contact
			REV:20230911
			END:VCARD`)
	})

	test('one broken contact does not blank the whole list (issue #5250)', () => {
		const state = {
			contacts: {
				[goodContact.key]: goodContact,
				[brokenRevContact.key]: brokenRevContact,
			},
			sortedContacts: [],
			orderKey: 'rev',
		}

		expect(() => mutations.sortContacts(state)).not.toThrow()

		expect(state.sortedContacts.map((contact) => contact.key))
			.toStrictEqual([goodContact.key])
	})

	test('a broken property not used for sorting keeps the contact listed', () => {
		const state = {
			contacts: {
				[goodContact.key]: goodContact,
				[brokenRevContact.key]: brokenRevContact,
			},
			sortedContacts: [],
			orderKey: 'displayName',
		}

		mutations.sortContacts(state)

		expect(state.sortedContacts.map((contact) => contact.key).sort())
			.toStrictEqual([brokenRevContact.key, goodContact.key].sort())
	})

})
