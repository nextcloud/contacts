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
})
