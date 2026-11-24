/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// The store index has to be imported first to avoid a circular import issue
import '../../../src/store/index.js'
import Contact from '../../../src/models/contact.js'
import validate from '../../../src/services/validate.js'

function contactWithRev(version, rev) {
	return new Contact(`BEGIN:VCARD
VERSION:${version}
FN:Test contact
${rev}
END:VCARD`)
}

describe('invalid REV check', () => {
	test.each([
		['3.0', 'REV:2026-08-04T10::24Z'],
		['3.0', 'REV:'],
		['4.0', 'REV;VALUE=TEXT:garbage'],
	])('drops a vCard %s %s without inventing a new one', (version, rev) => {
		const contact = contactWithRev(version, rev)

		validate(contact)

		expect(contact.vCard.hasProperty('rev')).toBe(false)
	})

	test('keeps a valid REV', () => {
		const contact = contactWithRev('3.0', 'REV:20260101T120000Z')

		validate(contact)

		expect(contact.vCard.getFirstProperty('rev').toICALString()).toBe('REV:20260101T120000Z')
	})
})
