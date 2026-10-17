/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Contact from '../../../src/models/contact'

const getPropertyLines = (property, vcard) => {
	return vcard.match(new RegExp(`^${property}[;:].*`, 'gmi'))
}

describe('Test stripping quotes from TYPE', () => {

	let contact
	let property

	beforeEach(() => {
		contact = new Contact(`
			BEGIN:VCARD
			VERSION:3.0
			UID:123456789-123465-123456-123456789
			FN:Test contact
			END:VCARD`.replace(/\t/gmi, '')
		)
		property = contact.vCard.addPropertyWithValue('TEl', '+00 123 456 789')
	})

	test('Test stripping quotes from SINGLE TYPE', () => {
		property.setParameter('type', ['VOICE'])
		const line = getPropertyLines('TEL', contact.toStringStripQuotes())[0]

		expect(line).toStrictEqual('TEL;TYPE=VOICE:+00 123 456 789')
	})

	test('Test stripping quotes from MULTIPLE TYPES', () => {
		property.setParameter('type', ['WORK', 'VOICE'])
		const line = getPropertyLines('TEL', contact.toStringStripQuotes())[0]

		expect(line).toStrictEqual('TEL;TYPE=WORK,VOICE:+00 123 456 789')
	})

	test('Test stripping quotes from MULTIPLE SPLIT TYPES', () => {
		property.setParameter('type', ['WORK,VOICE'])
		const line = getPropertyLines('TEL', contact.toStringStripQuotes())[0]

		expect(line).toStrictEqual('TEL;TYPE=WORK,VOICE:+00 123 456 789')
	})

	test('Test hasEmail matches any email address case insensitively', () => {
		const contactWithEmails = new Contact(`
			BEGIN:VCARD
			VERSION:3.0
			UID:123456789-123465-123456-123456789
			FN:Test contact
			EMAIL:first@example.com
			EMAIL:Second@Example.com
			END:VCARD`.replace(/\t/gmi, '')
		)

		expect(contactWithEmails.hasEmail('first@example.com')).toBe(true)
		expect(contactWithEmails.hasEmail('second@example.com')).toBe(true)
		expect(contactWithEmails.hasEmail('third@example.com')).toBe(false)
	})

	test('Test stripping quotes from MULTIPLE SPLIT TYPES and MULTIPLE PROPERTIES', () => {
		const property2 = contact.vCard.addPropertyWithValue('TEl', '+99 876 543 210')
		property.setParameter('type', ['WORK,VOICE'])
		property2.setParameter('type', ['HOME'])

		const lines = getPropertyLines('TEL', contact.toStringStripQuotes())

		expect(lines).toStrictEqual([
			'TEL;TYPE=WORK,VOICE:+00 123 456 789',
			'TEL;TYPE=HOME:+99 876 543 210',
		])
	})

})

describe('Grouped properties (custom labels)', () => {

	const vcard = `
		BEGIN:VCARD
		VERSION:3.0
		UID:123456789-123465-123456-123456789
		FN:Test contact
		NEXTCLOUD1.TEL;TYPE=HOME,VOICE:+32382938
		NEXTCLOUD1.X-ABLABEL:Custom label
		END:VCARD`.replace(/\t/gmi, '')

	test('grouped properties parse into the group parameter form', () => {
		const contact = new Contact(vcard)

		const tel = contact.vCard.getFirstProperty('tel')
		expect(tel.getParameter('group')).toEqual('nextcloud1')
		expect(tel.getFirstValue()).toEqual('+32382938')

		const label = contact.vCard.getFirstProperty('x-ablabel')
		expect(label.getParameter('group')).toEqual('nextcloud1')
		expect(label.getFirstValue()).toEqual('Custom label')
	})

	test('grouped properties survive a serialization round trip', () => {
		const contact = new Contact(vcard)

		const telLine = getPropertyLines('NEXTCLOUD1.TEL', contact.toStringStripQuotes())[0]
		expect(telLine).toStrictEqual('NEXTCLOUD1.TEL;TYPE=HOME,VOICE:+32382938')

		const labelLine = getPropertyLines('NEXTCLOUD1.X-ABLABEL', contact.toStringStripQuotes())[0]
		expect(labelLine).toStrictEqual('NEXTCLOUD1.X-ABLABEL:Custom label')
	})
})
