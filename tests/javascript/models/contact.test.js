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

describe('Test groups setter', () => {

	let contact

	beforeEach(() => {
		contact = new Contact(
			'BEGIN:VCARD\nVERSION:3.0\nUID:123456789-123465-123456-123456789\nFN:Test contact\nEND:VCARD',
		)
	})

	test('groups setter updates jCal so the group is included in serialization', () => {
		contact.groups = ['Friends']

		expect(contact.groups).toEqual(['Friends'])
		expect(contact.vCard.toString()).toContain('CATEGORIES:Friends')
	})

	test('groups setter replaces existing groups', () => {
		contact.groups = ['OldGroup']
		contact.groups = ['NewGroup']

		expect(contact.groups).toEqual(['NewGroup'])
	})

	test('groups setter with empty array removes categories property', () => {
		contact.groups = ['SomeGroup']
		contact.groups = []

		expect(contact.groups).toEqual([])
		expect(contact.vCard.hasProperty('categories')).toBe(false)
	})

})