/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import PropertyMixin from '../../../src/mixins/PropertyMixin'
import Contact from '../../../src/models/contact'

const { createLabel, getNcGroupCount } = PropertyMixin.methods

const buildContext = (contact, property) => ({
	property,
	localContact: contact,
	getNcGroupCount,
	$emit: jest.fn(),
})

describe('createLabel', () => {

	let contact

	beforeEach(() => {
		contact = new Contact(`
			BEGIN:VCARD
			VERSION:3.0
			UID:123456789-123465-123456-123456789
			FN:Test contact
			TEL;TYPE=WORK,VOICE:+4343849384
			NEXTCLOUD1.TEL;TYPE=HOME,VOICE:+32382938
			NEXTCLOUD1.X-ABLABEL:Old label
			END:VCARD`.replace(/\t/gmi, '')
		)
	})

	test('groups an ungrouped property and adds its label', () => {
		const property = contact.vCard.getAllProperties('tel')
			.find((prop) => !prop.getParameter('group'))
		const context = buildContext(contact, property)

		createLabel.call(context, { name: 'My label' })

		expect(property.getParameter('group')).toEqual('nextcloud2')
		const label = contact.vCard.getAllProperties('x-ablabel')
			.find((prop) => prop.getParameter('group') === 'nextcloud2')
		expect(label.getFirstValue()).toEqual('My label')
		expect(context.$emit).toHaveBeenCalledWith('update')

		const vcard = contact.toStringStripQuotes()
		expect(vcard).toContain('NEXTCLOUD2.TEL;TYPE=WORK,VOICE:+4343849384')
		expect(vcard).toContain('NEXTCLOUD2.X-ABLABEL:My label')
	})

	test('updates the label of an already grouped property', () => {
		const property = contact.vCard.getAllProperties('tel')
			.find((prop) => prop.getParameter('group') === 'nextcloud1')
		const context = buildContext(contact, property)

		createLabel.call(context, { name: 'New label' })

		expect(property.getParameter('group')).toEqual('nextcloud1')
		const labels = contact.vCard.getAllProperties('x-ablabel')
		expect(labels.length).toEqual(1)
		expect(labels[0].getFirstValue()).toEqual('New label')
	})
})

describe('getNcGroupCount', () => {

	test('returns the highest nextcloud group number', () => {
		const contact = new Contact(`
			BEGIN:VCARD
			VERSION:3.0
			UID:123456789-123465-123456-123456789
			FN:Test contact
			ITEM1.TEL:+1
			NEXTCLOUD3.TEL:+2
			NEXTCLOUD7.EMAIL:mail@example.com
			END:VCARD`.replace(/\t/gmi, '')
		)

		expect(getNcGroupCount.call({ localContact: contact })).toEqual(7)
	})

	test('returns 0 when there is no nextcloud group', () => {
		const contact = new Contact(`
			BEGIN:VCARD
			VERSION:3.0
			UID:123456789-123465-123456-123456789
			FN:Test contact
			TEL:+1
			END:VCARD`.replace(/\t/gmi, '')
		)

		expect(getNcGroupCount.call({ localContact: contact })).toEqual(0)
	})
})
