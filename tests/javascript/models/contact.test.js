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

describe('Test revTimestamp', () => {

	const contactWithRev = (rev, version = '3.0') => new Contact(`
		BEGIN:VCARD
		VERSION:${version}
		UID:123456789-123465-123456-123456789
		FN:Test contact
		REV:${rev}
		END:VCARD`.replace(/\t/gmi, '')
	)

	const expected = Date.parse('2026-03-12T19:25:00Z') / 1000

	test.each([
		['20260312T192500Z', '3.0'],
		['20260312T192500Z', '4.0'],
		['2026-03-12T19:25:00Z', '3.0'],
		['20260312T1925Z', '3.0'],
		['20260312T1925Z', '4.0'],
		['2026-03-12T19:25Z', '3.0'],
	])('parses REV:%s (vCard %s)', (rev, version) => {
		expect(contactWithRev(rev, version).revTimestamp).toBe(expected)
	})

	test.each([
		['20260312T202500+0100', '3.0'],
		['2026-03-12T20:25:00+01:00', '3.0'],
	])('parses REV:%s with UTC offset (vCard %s)', (rev, version) => {
		expect(contactWithRev(rev, version).revTimestamp).toBe(expected)
	})

	test('returns null when REV is missing', () => {
		const contact = new Contact(`
			BEGIN:VCARD
			VERSION:3.0
			UID:123456789-123465-123456-123456789
			FN:Test contact
			END:VCARD`.replace(/\t/gmi, '')
		)

		expect(contact.revTimestamp).toBeNull()
	})

	test.each([
		['not-a-date', '3.0'],
		['not-a-date', '4.0'],
		['T1925Z', '3.0'],
	])('returns null for REV:%s (vCard %s)', (rev, version) => {
		expect(contactWithRev(rev, version).revTimestamp).toBeNull()
	})

	test.each(['3.0', '4.0'])('rev getter does not throw on malformed REV (vCard %s)', (version) => {
		expect(() => contactWithRev('not-a-date', version).rev).not.toThrow()
	})

})
