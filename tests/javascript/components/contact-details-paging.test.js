/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/browser-storage', () => {
	const storage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() }
	const builder = { persist: () => builder, clearOnLogout: () => builder, build: () => storage }
	return { getBuilder: () => builder }
})
jest.mock('@nextcloud/initial-state', () => ({
	loadState: jest.fn((app, key, fallback) => fallback),
}))
jest.mock('@nextcloud/router', () => ({
	generateUrl: (path) => path,
	generateRemoteUrl: (path) => path,
	generateOcsUrl: (path) => path,
	imagePath: (app, path) => path,
}))
jest.mock('ical.js', () => ({ design: { vcard: {}, vcard3: {} } }))
jest.mock('../../../src/components/ContactDetails/ContactDetailsAddNewProp.vue', () => ({ default: {} }))
jest.mock('../../../src/components/ContactDetails/ContactDetailsAvatar.vue', () => ({ default: {} }))
jest.mock('../../../src/components/ContactDetails/ContactDetailsProperty.vue', () => ({ default: {} }))
jest.mock('../../../src/components/DetailsHeader.vue', () => ({ default: {} }))
jest.mock('../../../src/components/Properties/PropertyGroups.vue', () => ({ default: {} }))
jest.mock('../../../src/components/Properties/PropertyRev.vue', () => ({ default: {} }))
jest.mock('../../../src/components/Properties/PropertySelect.vue', () => ({ default: {} }))
jest.mock('../../../src/models/rfcProps.js', () => ({ default: { properties: {}, fieldOrder: [] } }))
jest.mock('../../../src/services/cdav.js', () => ({
	__esModule: true,
	default: { isAddressBookQueryContinuationSupported: jest.fn(() => true) },
}))
jest.mock('../../../src/services/isTalkEnabled.js', () => ({ default: false }))
jest.mock('../../../src/services/validate.js', () => ({ default: jest.fn() }))

jest.mock('@mdi/svg/svg/cancel.svg?raw', () => ({ default: '' }), { virtual: true })

import { namespaces } from '@nextcloud/cdav-library'
import { Buffer } from 'buffer'
import ContactDetails from '../../../src/components/ContactDetails.vue'
import client from '../../../src/services/cdav.js'

const details = ContactDetails.default || ContactDetails

const CARDDAV = 'urn:ietf:params:xml:ns:carddav'
namespaces.IETF_CARDDAV = CARDDAV

const contactKey = (uid, addressbookId) => Buffer.from(`${uid}~${addressbookId}`, 'utf8').toString('base64')

/**
 * @param {object[]} addressbooks the store address books
 * @param {Function} [onDispatch] called with the dispatched action and payload
 * @return {object} a fake ContactDetails instance
 */
function detailsContext(addressbooks, onDispatch = () => {}) {
	const contacts = {}
	return {
		contacts,
		loadingContact: false,
		loadingManagers: false,
		addressbooks,
		contact: undefined,
		$store: {
			getters: {
				getAddressbooks: addressbooks,
				getContact: (key) => contacts[key],
			},
			dispatch: jest.fn(async (action, payload) => onDispatch(action, payload, contacts)),
		},
	}
}

beforeEach(() => {
	jest.clearAllMocks()
	client.isAddressBookQueryContinuationSupported.mockReturnValue(true)
})

describe('Contact details with paged address books', () => {
	test('a routed contact that is not loaded is queried by uid in its address book', async () => {
		const addressbook = { id: 'contacts', enabled: true, paginated: true, continuationToken: 'token', contacts: {} }
		const other = { id: 'other', enabled: true, paginated: true, continuationToken: 'token', contacts: {} }
		const key = contactKey('bob', 'contacts')
		const vm = detailsContext([other, addressbook], (action, payload, contacts) => {
			contacts[key] = { key }
			payload.addressbook.contacts.bob = contacts[key]
		})

		const loading = details.methods.loadMissingContact.call(vm, key)
		expect(vm.loadingContact).toBe(true)
		await loading

		expect(vm.$store.dispatch).toHaveBeenCalledTimes(1)
		expect(vm.$store.dispatch).toHaveBeenCalledWith('queryContacts', {
			addressbook,
			filter: [{
				name: [CARDDAV, 'prop-filter'],
				attributes: [['name', 'UID']],
				children: [{
					name: [CARDDAV, 'text-match'],
					attributes: [['collation', 'i;unicode-casemap'], ['match-type', 'equals']],
					value: 'bob',
				}],
			}],
		})
		expect(vm.contacts[key]).toEqual({ key })
		expect(vm.loadingContact).toBe(false)
	})

	test('nothing is queried when the server does not page address books', async () => {
		client.isAddressBookQueryContinuationSupported.mockReturnValue(false)
		const vm = detailsContext([{ id: 'contacts', enabled: true, paginated: false, continuationToken: null, contacts: {} }])

		await details.methods.loadMissingContact.call(vm, contactKey('bob', 'contacts'))

		expect(vm.$store.dispatch).not.toHaveBeenCalled()
		expect(vm.loadingContact).toBe(false)
	})

	test('the line manager options load the whole address book of the contact', async () => {
		const addressbook = { id: 'contacts', enabled: true, paginated: true, continuationToken: 'token', contacts: {} }
		const vm = detailsContext([addressbook])
		vm.contact = { addressbook: { id: 'contacts' } }

		await details.methods.loadManagerOptions.call(vm)

		expect(vm.$store.dispatch).toHaveBeenCalledWith('loadAllContacts', { addressbook })
		expect(vm.loadingManagers).toBe(false)
	})

	test('the line manager options are already loaded without a continuation token', async () => {
		const addressbook = { id: 'contacts', enabled: true, paginated: false, continuationToken: null, contacts: {} }
		const vm = detailsContext([addressbook])
		vm.contact = { addressbook: { id: 'contacts' } }

		await details.methods.loadManagerOptions.call(vm)

		expect(vm.$store.dispatch).not.toHaveBeenCalled()
	})
})
