/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { showError } from '@nextcloud/dialogs'
import addressbooksStore from '../../../src/store/addressbooks.js'

jest.mock('@nextcloud/dialogs', () => ({
	showError: jest.fn(),
}))

// break the circular import chain
// addressbooks.js -> models/contact.js -> store/index.js -> addressbooks.js
jest.mock('../../../src/store/index.js', () => ({ getters: {} }))

const { actions } = addressbooksStore

const VALID_VCARD = 'BEGIN:VCARD\r\nVERSION:4.0\r\nUID:valid-contact\r\nFN:Valid contact\r\nEND:VCARD'

const buildAddressbook = (response) => ({
	id: 'addressbook1',
	displayName: 'Addressbook 1',
	enabled: true,
	dav: {
		findAllAndFilterBySimpleProperties: jest.fn()
			.mockImplementation(() => response instanceof Error
				? Promise.reject(response)
				: Promise.resolve(response)),
	},
})

describe('getContactsFromAddressBook action', () => {

	let context

	beforeEach(() => {
		jest.clearAllMocks()
		context = { commit: jest.fn() }
	})

	test('parses the fetched contacts and commits them to the store', async () => {
		const addressbook = buildAddressbook([{ url: '/valid', data: VALID_VCARD }])

		const contacts = await actions.getContactsFromAddressBook(context, { addressbook })

		expect(contacts).toHaveLength(1)
		expect(context.commit).toHaveBeenCalledWith('appendContactsToAddressbook', { addressbook, contacts })
		expect(context.commit).toHaveBeenCalledWith('sortContacts')
		expect(context.commit).not.toHaveBeenCalledWith('deleteAddressbook', addressbook)
	})

	test('removes the addressbook from the store when the DAV fetch fails', async () => {
		const addressbook = buildAddressbook(new Error('network error'))

		await actions.getContactsFromAddressBook(context, { addressbook })

		expect(context.commit).toHaveBeenCalledWith('deleteAddressbook', addressbook)
	})

	test('keeps the addressbook when processing the contacts fails (issues #5149, #5250)', async () => {
		const addressbook = buildAddressbook([{ url: '/valid', data: VALID_VCARD }])
		context.commit.mockImplementation((mutation) => {
			if (mutation === 'sortContacts') {
				throw new Error('a broken contact crashed a store mutation')
			}
		})

		await expect(actions.getContactsFromAddressBook(context, { addressbook }))
			.resolves.toBeUndefined()

		expect(context.commit).not.toHaveBeenCalledWith('deleteAddressbook', addressbook)
		expect(showError).toHaveBeenCalled()
	})

	test('skips unparseable contacts and shows an error toast', async () => {
		const addressbook = buildAddressbook([
			{ url: '/valid', data: VALID_VCARD },
			{ url: '/invalid', data: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR' },
		])

		const contacts = await actions.getContactsFromAddressBook(context, { addressbook })

		expect(contacts).toHaveLength(1)
		expect(showError).toHaveBeenCalled()
		expect(context.commit).not.toHaveBeenCalledWith('deleteAddressbook', addressbook)
	})

})
