/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// The store index has to be imported first to avoid a circular import issue
import '../../../src/store/index.js'
import Contact from '../../../src/models/contact.js'
import { DEFAULT_SUBTITLE_ORDER, pickSubtitle } from '../../../src/utils/subtitle.js'

const addressbook = { id: 'ab1', displayName: 'Address book', enabled: true, contacts: {} }

/**
 * Build a contact with the given vCard lines after its name
 *
 * @param {string[]} lines vCard property lines
 * @return {Contact}
 */
function contact(lines = []) {
	return new Contact(['BEGIN:VCARD', 'VERSION:4.0', 'FN:Name', ...lines, 'END:VCARD'].join('\n'), addressbook)
}

const ORG = 'ORG:Acme Plumbing'
const EMAIL = 'EMAIL:name@example.com'
const TEL = 'TEL:+1 555 0100'

describe('pickSubtitle', () => {
	test('keeps the old order by default: organization, then email, then phone', () => {
		expect(pickSubtitle(contact([ORG, EMAIL, TEL]))).toBe('Acme Plumbing')
		expect(pickSubtitle(contact([EMAIL, TEL]))).toBe('name@example.com')
		expect(pickSubtitle(contact([TEL]))).toBe('+1 555 0100')
	})

	test('shows the first field of the order that the contact has', () => {
		const order = ['tel', 'org', 'email']

		expect(pickSubtitle(contact([ORG, EMAIL, TEL]), order)).toBe('+1 555 0100')
		expect(pickSubtitle(contact([ORG, EMAIL]), order)).toBe('Acme Plumbing')
		expect(pickSubtitle(contact([EMAIL]), order)).toBe('name@example.com')
	})

	test('shows the first of several phone numbers', () => {
		expect(pickSubtitle(contact(['TEL:+1 555 0100', 'TEL:+1 555 0199']), ['tel', 'org', 'email'])).toBe('+1 555 0100')
	})

	test('is empty for a contact with none of the fields', () => {
		expect(pickSubtitle(contact(), DEFAULT_SUBTITLE_ORDER)).toBe('')
	})

	test('skips an unknown field', () => {
		expect(pickSubtitle(contact([EMAIL]), ['adr', 'email'])).toBe('name@example.com')
	})
})
