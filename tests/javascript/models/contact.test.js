/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Contact from '../../../src/models/contact'

const getPropertyLines = (property, vcard) => {
	return vcard.match(new RegExp(`^${property}[;:].*`, 'gmi'))
}

describe('Test getPhotoUrl', () => {

	// 1x1 transparent PNG
	const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

	const buildContact = (photoLine, version = '3.0') => new Contact(`
		BEGIN:VCARD
		VERSION:${version}
		UID:123456789-123465-123456-123456789
		FN:Test contact
		${photoLine}
		END:VCARD`.replace(/\t/gmi, ''),
	{ id: 'addressbook1' })

	beforeAll(() => {
		global.URL.createObjectURL = jest.fn((blob) => `blob:${blob.type}`)
	})

	test('photo with an explicit TYPE parameter', async () => {
		const contact = buildContact(`PHOTO;ENCODING=b;TYPE=png:${pngB64}`)

		expect(await contact.getPhotoUrl()).toStrictEqual('blob:image/png')
	})

	test('photo without a TYPE parameter is detected from the image data (issue #5401)', async () => {
		const contact = buildContact(`PHOTO;ENCODING=b:${pngB64}`)

		expect(await contact.getPhotoUrl()).toStrictEqual('blob:image/png')
	})

	test('jpeg photo without a TYPE parameter', async () => {
		const contact = buildContact('PHOTO;ENCODING=b:/9j/4AAQSkZJRgABAQ==')

		expect(await contact.getPhotoUrl()).toStrictEqual('blob:image/jpeg')
	})

	test('photo of an unknown type falls back to jpeg and warns', async () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
		// base64 that matches none of the known magic byte signatures
		const contact = buildContact('PHOTO;ENCODING=b:Zm9vYmFyYmF6cXV4')

		expect(await contact.getPhotoUrl()).toStrictEqual('blob:image/jpeg')
		expect(warn).toHaveBeenCalled()

		warn.mockRestore()
	})

	test('photo from a data uri (vCard 4.0)', async () => {
		const contact = buildContact(`PHOTO:data:image/png;base64,${pngB64}`, '4.0')

		expect(await contact.getPhotoUrl()).toStrictEqual('blob:image/png')
	})

})

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
