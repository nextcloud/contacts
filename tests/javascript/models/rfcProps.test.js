/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Contact from '../../../src/models/contact'
import rfcProps from '../../../src/models/rfcProps'

describe('RFC props', () => {

	let contact

	beforeEach(() => {
		contact = new Contact(`
			BEGIN:VCARD
			VERSION:4.0
			UID:123456789-123465-123456-123456789
			FN:Test contact
			END:VCARD`.replace(/\t/gmi, '')
		)
	})

	test('impp default value produces a serializable single-value property', () => {
		const defaultData = rfcProps.properties.impp.defaultValue
		const property = contact.vCard.addPropertyWithValue('impp', defaultData.value)
		property.setParameter('type', defaultData.type)

		expect(typeof property.getFirstValue()).toBe('string')
		expect(property.getParameter('type')).toEqual(defaultData.type)
		expect(contact.vCard.toString()).toMatch(/^IMPP;TYPE=.+:$/m)
	})

	test.each(['3.0', '4.0'])('pronouns text is escaped and unescaped in vCard %s', (version) => {
		const pronouns = new Contact(`
			BEGIN:VCARD
			VERSION:${version}
			UID:123456789-123465-123456-123456789
			FN:Test contact
			PRONOUNS:she\\, they
			END:VCARD`.replace(/\t/gmi, ''))

		expect(pronouns.vCard.getFirstPropertyValue('pronouns')).toBe('she, they')

		pronouns.vCard.getFirstProperty('pronouns').setValue('xe, they')

		expect(pronouns.vCard.toString()).toMatch(/^PRONOUNS:xe\\, they$/m)
	})
})
