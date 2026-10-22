/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/auth', () => ({
	getCurrentUser: jest.fn(() => ({ uid: 'alice' })),
}))

jest.mock('@nextcloud/dialogs', () => ({
	showError: jest.fn(),
}))

jest.mock('@nextcloud/event-bus', () => ({
	emit: jest.fn(),
}))

jest.mock('@nextcloud/router', () => ({
	generateUrl: (path) => path,
}))

jest.mock('@nextcloud/vue', () => ({
	NcButton: {},
	NcContent: {},
	NcLoadingIcon: {},
	NcModal: {},
}))

jest.mock('ical.js', () => ({}))

jest.mock('pinia', () => ({
	mapStores: () => ({}),
}))

jest.mock('../../../src/components/AppContent/ChartContent.vue', () => ({ default: {} }))
jest.mock('../../../src/components/AppContent/CircleContent.vue', () => ({ default: {} }))
jest.mock('../../../src/components/AppContent/ContactsContent.vue', () => ({ default: {} }))
jest.mock('../../../src/components/AppContent/OcmInvitesContent.vue', () => ({ default: {} }))
jest.mock('../../../src/components/AppNavigation/RootNavigation.vue', () => ({ default: {} }))
jest.mock('../../../src/components/AppNavigation/Settings/SettingsImportContacts.vue', () => ({ default: {} }))
jest.mock('../../../src/components/EntityPicker/ContactsPicker.vue', () => ({ default: {} }))
jest.mock('../../../src/components/Ocm/OcmAcceptForm.vue', () => ({ default: {} }))
jest.mock('../../../src/components/Ocm/OcmInviteAccept.vue', () => ({ default: {} }))
jest.mock('../../../src/components/Ocm/OcmInviteForm.vue', () => ({ default: {} }))
jest.mock('../../../src/views/Processing/ImportView.vue', () => ({ default: {} }))
jest.mock('../../../src/mixins/IsMobileMixin.ts', () => ({ default: {} }))
jest.mock('../../../src/mixins/RouterMixin.js', () => ({ default: {} }))
jest.mock('../../../src/models/constants.ts', () => ({
	GROUP_ALL_CONTACTS: 'all',
	GROUP_ALL_OCM_INVITES: 'all-ocm',
	GROUP_NO_GROUP_CONTACTS: 'nogroup',
	ROUTE_CIRCLE: 'circle',
	ROUTE_NAME_ALL_OCM_INVITES: 'all_ocm_invites',
	ROUTE_NAME_INVITE_ACCEPT_DIALOG: 'invite_accept_dialog',
	ROUTE_NAME_OCM_INVITE: 'ocm_invite',
	ROUTE_USER_GROUP: 'user-group',
}))
jest.mock('../../../src/models/contact.js', () => ({ default: class Contact {} }))
jest.mock('../../../src/models/rfcProps.js', () => ({ default: {} }))
jest.mock('../../../src/services/cdav.js', () => ({
	__esModule: true,
	default: { isAddressBookQueryContinuationSupported: jest.fn(() => true) },
}))
jest.mock('../../../src/services/isOcmInvitesEnabled.js', () => ({ default: false }))
jest.mock('../../../src/services/logger.js', () => ({
	__esModule: true,
	default: {
		error: jest.fn(),
	},
}))
jest.mock('../../../src/store/ocminvites.ts', () => ({ default: jest.fn() }))
jest.mock('../../../src/store/principals.js', () => ({ default: jest.fn() }))
jest.mock('../../../src/store/userGroup.ts', () => ({ default: jest.fn() }))
jest.mock('vue-material-design-icons/AccountArrowDownOutline.vue', () => ({ default: {} }))
jest.mock('vue-material-design-icons/AccountSwitchOutline.vue', () => ({ default: {} }))
jest.mock('vue-material-design-icons/Check.vue', () => ({ default: {} }))
jest.mock('vue-material-design-icons/Plus.vue', () => ({ default: {} }))

import { namespaces } from '@nextcloud/cdav-library'
import { showError } from '@nextcloud/dialogs'
import { Buffer } from 'buffer'
import client from '../../../src/services/cdav.js'
import Contacts from '../../../src/views/Contacts.vue'

const view = Contacts.default || Contacts

const CARDDAV = 'urn:ietf:params:xml:ns:carddav'
namespaces.IETF_CARDDAV = CARDDAV

const contactKey = (uid, addressbookId) => Buffer.from(`${uid}~${addressbookId}`, 'utf8').toString('base64')

/**
 * @param {string} name the vCard property name
 * @param {object} condition the text-match or is-not-defined element
 * @return {object[]} an addressbook-query filter
 */
function propFilter(name, condition) {
	return [{
		name: [CARDDAV, 'prop-filter'],
		attributes: [['name', name]],
		children: [condition],
	}]
}

/**
 * @param {string} value the text to match
 * @param {string} matchType the match type
 * @return {object} a text-match element
 */
function textMatch(value, matchType) {
	return {
		name: [CARDDAV, 'text-match'],
		attributes: [['collation', 'i;unicode-casemap'], ['match-type', matchType]],
		value,
	}
}

/**
 * Build a fake Contacts view instance
 *
 * @param {object} params the route params
 * @param {object} options the store content
 * @param {object[]} options.addressbooks the store address books
 * @param {Function} [options.onQuery] called with the queryContacts payload and the contacts map
 * @return {object}
 */
function viewContext(params, { addressbooks, onQuery = () => {} }) {
	const contacts = {}
	const vm = {
		$route: { name: params.selectedContact ? 'contact' : 'group', params },
		selectedGroup: params.selectedGroup,
		selectedContact: params.selectedContact,
		selectedAddressbook: undefined,
		selectedCircle: undefined,
		selectedUserGroup: undefined,
		selectedChart: undefined,
		addressbooks,
		groups: [],
		get contactsList() {
			return Object.keys(contacts).map((key) => ({ key }))
		},
		$store: {
			getters: {
				getAddressbooks: addressbooks,
				getContact: (key) => contacts[key],
			},
			dispatch: jest.fn(async (action, payload) => onQuery(payload, contacts)),
		},
		$router: { push: jest.fn() },
		listRoute: jest.fn(() => ({ name: 'group', params: { selectedGroup: params.selectedGroup } })),
		contactRoute: jest.fn((selectedContact) => ({ name: 'contact', params: { selectedGroup: params.selectedGroup, selectedContact } })),
	}
	vm.loadRouteSelection = view.methods.loadRouteSelection.bind(vm)
	return vm
}

const pagedAddressbook = (id, continuationToken) => ({ id, enabled: true, paginated: true, continuationToken, contacts: {} })

beforeEach(() => {
	jest.clearAllMocks()
	client.isAddressBookQueryContinuationSupported.mockReturnValue(true)
})

describe('Contacts view with paged address books', () => {
	test('selecting a group queries its members in every partially loaded address book', async () => {
		const partial = pagedAddressbook('contacts', 'token')
		const complete = pagedAddressbook('complete', null)
		const disabled = { ...pagedAddressbook('disabled', 'token'), enabled: false }
		const vm = viewContext({ selectedGroup: 'Friends' }, { addressbooks: [partial, complete, disabled] })

		await view.methods.loadRouteSelection.call(vm)

		expect(vm.$store.dispatch).toHaveBeenCalledTimes(1)
		expect(vm.$store.dispatch).toHaveBeenCalledWith('queryContacts', {
			addressbook: partial,
			filter: propFilter('CATEGORIES', textMatch('Friends', 'contains')),
		})
	})

	test('a group is only queried once', async () => {
		const vm = viewContext({ selectedGroup: 'Colleagues' }, { addressbooks: [pagedAddressbook('contacts', 'token')] })

		await view.methods.loadRouteSelection.call(vm)
		await view.methods.loadRouteSelection.call(vm)

		expect(vm.$store.dispatch).toHaveBeenCalledTimes(1)
	})

	test('selecting not grouped queries the contacts without categories', async () => {
		const partial = pagedAddressbook('contacts', 'token')
		const vm = viewContext({ selectedGroup: 'nogroup' }, { addressbooks: [partial] })

		await view.methods.loadRouteSelection.call(vm)

		expect(vm.$store.dispatch).toHaveBeenCalledWith('queryContacts', {
			addressbook: partial,
			filter: propFilter('CATEGORIES', { name: [CARDDAV, 'is-not-defined'] }),
		})
	})

	test('all contacts does not query anything', async () => {
		const vm = viewContext({ selectedGroup: 'all' }, { addressbooks: [pagedAddressbook('contacts', 'token')] })

		await view.methods.loadRouteSelection.call(vm)

		expect(vm.$store.dispatch).not.toHaveBeenCalled()
	})

	test('nothing is queried when the server does not page address books', async () => {
		client.isAddressBookQueryContinuationSupported.mockReturnValue(false)
		const vm = viewContext({ selectedGroup: 'Family', selectedContact: contactKey('alice', 'contacts') }, {
			addressbooks: [pagedAddressbook('contacts', 'token')],
		})

		await view.methods.selectFirstContactIfNone.call(vm)

		expect(vm.$store.dispatch).not.toHaveBeenCalled()
		expect(showError).toHaveBeenCalledWith('Contact not found')
	})

	test('a deep link loads the contact by uid before selecting it', async () => {
		const partial = pagedAddressbook('contacts', 'token')
		const key = contactKey('alice@example.com', 'contacts')
		const vm = viewContext({ selectedGroup: 'all', selectedContact: key }, {
			addressbooks: [partial],
			onQuery: (payload, contacts) => {
				contacts[key] = { key }
				payload.addressbook.contacts['alice@example.com'] = contacts[key]
			},
		})

		await view.methods.selectFirstContactIfNone.call(vm)

		expect(vm.$store.dispatch).toHaveBeenCalledWith('queryContacts', {
			addressbook: partial,
			filter: propFilter('UID', textMatch('alice@example.com', 'equals')),
		})
		expect(showError).not.toHaveBeenCalled()
		expect(vm.$router.push).not.toHaveBeenCalled()
	})

	test('a deep link to a contact missing on the server still shows not found', async () => {
		const partial = pagedAddressbook('contacts', 'token')
		const vm = viewContext({ selectedGroup: 'all', selectedContact: contactKey('ghost', 'contacts') }, { addressbooks: [partial] })

		await view.methods.selectFirstContactIfNone.call(vm)

		expect(vm.$store.dispatch).toHaveBeenCalledWith('queryContacts', {
			addressbook: partial,
			filter: propFilter('UID', textMatch('ghost', 'equals')),
		})
		expect(showError).toHaveBeenCalledWith('Contact not found')
		expect(vm.$router.push).toHaveBeenCalledWith({ name: 'group', params: { selectedGroup: 'all' } })
	})

	test('a deep link into a fully loaded address book does not query it', async () => {
		const vm = viewContext({ selectedGroup: 'all', selectedContact: contactKey('ghost', 'complete') }, {
			addressbooks: [pagedAddressbook('complete', null)],
		})

		await view.methods.loadRouteSelection.call(vm)

		expect(vm.$store.dispatch).not.toHaveBeenCalled()
	})
})
