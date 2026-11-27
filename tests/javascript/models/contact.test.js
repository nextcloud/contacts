/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import ICAL from 'ical.js'
import Contact from '../../../src/models/contact'
import updateDesignSet from '../../../src/services/updateDesignSet.js'

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

describe('Test reading an invalid REV', () => {
	test('Does not throw when reading a malformed revision', () => {
		const contact = new Contact(`
			BEGIN:VCARD
			VERSION:3.0
			FN:Test contact
			REV:2026-08-04T10::24Z
			END:VCARD`.replace(/\t/gmi, '')
		)
		expect(contact.rev).toBeNull()
	})

	test('Does not return a text revision', () => {
		const contact = new Contact(`
			BEGIN:VCARD
			VERSION:4.0
			FN:Test contact
			REV;VALUE=TEXT:garbage
			END:VCARD`.replace(/\t/gmi, '')
		)
		expect(contact.rev).toBeNull()
	})
})

describe('Multiline notes', () => {
	const multilineNote = 'First line\nSecond line\nThird line'
	const createVCard = (version, ...properties) => [
		'BEGIN:VCARD',
		`VERSION:${version}`,
		'UID:test-multiline-note',
		'FN:Test Contact',
		'N:Contact;Test;;;',
		...properties,
		'END:VCARD',
		'',
	].join('\r\n')

	beforeEach(() => {
		for (const design of [ICAL.design.vcard3, ICAL.design.vcard]) {
			jest.replaceProperty(design, 'property', { ...design.property, pronouns: { defaultType: 'text' } })
			jest.replaceProperty(design.param, 'type', { ...design.param.type, multiValueSeparateDQuote: false })
		}
		ICAL.design.vcard3.property.note = ICAL.design.vcard3.property.categories
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	test.each(['3.0', '4.0'])('reads a multiline vCard %s note as one text value', (version) => {
		const contact = new Contact(createVCard(version, 'NOTE:First line\\nSecond line\\nThird line'))
		const note = contact.vCard.getFirstProperty('note')

		expect(note.isMultiValue).toBe(false)
		expect(note.getValues()).toStrictEqual([multilineNote])
	})

	test.each(['adding', 'editing'])('preserves the note after %s it and saving', (action) => {
		const properties = action === 'editing' ? ['NOTE:Original note'] : []
		const contact = new Contact(createVCard('3.0', ...properties))
		const note = action === 'editing'
			? contact.vCard.getFirstProperty('note')
			: contact.vCard.addPropertyWithValue('note', '')
		const editedNote = 'Café, first line; with \\ a backslash\nSecond line: 東京'

		note.setValue(editedNote)
		const savedNote = new Contact(contact.toStringStripQuotes()).vCard.getFirstProperty('note')

		expect(savedNote.isMultiValue).toBe(false)
		expect(savedNote.getValues()).toStrictEqual([editedNote])
	})

	test('unfolds a grouped vCard 3.0 note with escaped punctuation and newlines', () => {
		const contact = new Contact(createVCard('3.0', 'ITEM1.NOTE:First line\\, with a comma\\nSec', ' ond line!\\nThird line'))
		const note = contact.vCard.getFirstProperty('note')

		expect(note.isMultiValue).toBe(false)
		expect(note.getValues()).toStrictEqual(['First line, with a comma\nSecond line!\nThird line'])
	})

	test('keeps vCard 3.0 categories multivalued alongside a note', () => {
		const contact = new Contact(createVCard('3.0', 'CATEGORIES:Family,Friends', 'NOTE:First line\\nSecond line\\nThird line'))
		const categories = contact.vCard.getFirstProperty('categories')

		expect(contact.vCard.getFirstProperty('note').getValues()).toStrictEqual([multilineNote])
		expect(categories.isMultiValue).toBe(true)
		expect(categories.getValues()).toStrictEqual(['Family', 'Friends'])
	})

	test('reparses the first vCard 3.0 contact with a legacy unescaped comma', () => {
		const contact = new Contact(createVCard('3.0', 'NOTE:First line, with a comma\\nSecond line'))

		expect(contact.vCard.getFirstProperty('note').getValues()).toStrictEqual(['First line, with a comma\nSecond line'])
	})

	test('replaces the shared vCard 3.0 note definition only once', () => {
		const vCard = ICAL.parse(createVCard('3.0'))
		const original = ICAL.design.vcard3.property.note
		const vCard4Note = ICAL.design.vcard.property.note

		expect(updateDesignSet(vCard)).toBeTruthy()
		const corrected = ICAL.design.vcard3.property.note
		expect(corrected).not.toBe(original)
		expect(corrected).toStrictEqual({ defaultType: 'text' })
		expect(ICAL.design.vcard.property.note).toBe(vCard4Note)
		expect(updateDesignSet(vCard)).toBeFalsy()
		expect(ICAL.design.vcard3.property.note).toBe(corrected)
	})

	test('keeps an already-correct upstream vCard 3.0 note definition', () => {
		const upstreamNote = ICAL.design.vcard3.property.fn
		ICAL.design.vcard3.property.note = upstreamNote

		expect(updateDesignSet(ICAL.parse(createVCard('3.0')))).toBeFalsy()
		expect(ICAL.design.vcard3.property.note).toBe(upstreamNote)
	})
})
