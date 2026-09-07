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
jest.mock('../../../src/services/isTalkEnabled.js', () => ({ default: false }))
jest.mock('../../../src/services/validate.js', () => ({ default: jest.fn() }))

jest.mock('../../../src/components/ContactsList/Batch.vue', () => ({ default: {} }))
jest.mock('../../../src/components/ContactsList/ContactsListItem.vue', () => ({ default: {} }))
jest.mock('../../../src/components/ContactsList/Merging.vue', () => ({ default: {} }))
jest.mock('virtua/vue', () => ({ VList: {} }))

jest.mock('@mdi/svg/svg/cancel.svg?raw', () => ({ default: '' }), { virtual: true })
jest.mock('@mdi/svg/svg/delete-outline.svg', () => ({ default: '' }), { virtual: true })

import ContactDetails from '../../../src/components/ContactDetails.vue'
import ContactsList from '../../../src/components/ContactsList.vue'
import RouterMixin from '../../../src/mixins/RouterMixin.js'

const details = ContactDetails.default || ContactDetails
const list = ContactsList.default || ContactsList
const routerMixin = RouterMixin.default || RouterMixin

/**
 * Resolve the RouterMixin computed properties and methods against a route.
 *
 * @param {object} params the route params
 * @return {object} the router mixin part of a component instance
 */
function routerContext(params) {
	const context = { $route: { params } }
	for (const [name, getter] of Object.entries(routerMixin.computed)) {
		context[name] = getter.call(context)
	}
	return Object.assign(context, routerMixin.methods)
}

describe('Contact deletion route', () => {
	test('drops the deleted contact from a group route', async () => {
		const vm = {
			...routerContext({ selectedGroup: 'All contacts', selectedContact: 'bob.vcf~contacts' }),
			contact: { key: 'bob.vcf~contacts' },
			$store: { dispatch: jest.fn().mockResolvedValue(undefined) },
			$router: { replace: jest.fn() },
		}

		await details.methods.deleteContact.call(vm)

		expect(vm.$store.dispatch).toHaveBeenCalledWith('deleteContact', { contact: vm.contact })
		expect(vm.$router.replace).toHaveBeenCalledWith({
			name: 'group',
			params: { selectedGroup: 'All contacts' },
		})
	})

	test('drops the deleted contact from an address book route', async () => {
		const vm = {
			...routerContext({ selectedAddressbook: 'contacts', selectedContact: 'bob.vcf~contacts' }),
			contact: { key: 'bob.vcf~contacts' },
			$store: { dispatch: jest.fn().mockResolvedValue(undefined) },
			$router: { replace: jest.fn() },
		}

		await details.methods.deleteContact.call(vm)

		expect(vm.$router.replace).toHaveBeenCalledWith({
			name: 'addressbook',
			params: { selectedAddressbook: 'contacts' },
		})
	})

	test('waits for the deletion before leaving the route', async () => {
		const order = []
		const vm = {
			...routerContext({ selectedGroup: 'All contacts', selectedContact: 'bob.vcf~contacts' }),
			contact: { key: 'bob.vcf~contacts' },
			$store: { dispatch: jest.fn(() => Promise.resolve().then(() => order.push('deleted'))) },
			$router: { replace: jest.fn(() => order.push('navigated')) },
		}

		await details.methods.deleteContact.call(vm)

		expect(order).toEqual(['deleted', 'navigated'])
	})

	test('drops the route when the open contact is deleted with a multi selection', async () => {
		const order = []
		const vm = {
			...routerContext({ selectedGroup: 'All contacts', selectedContact: 'bob.vcf~contacts' }),
			multiSelectedContacts: new Map([
				[0, { key: 'alice.vcf~contacts', addressbook: { readOnly: true } }],
				[1, { key: 'bob.vcf~contacts', addressbook: { readOnly: false } }],
			]),
			showDeleteConfirmationDialog: true,
			$store: { dispatch: jest.fn(() => Promise.resolve().then(() => order.push('deleted'))) },
			$router: { replace: jest.fn(() => order.push('navigated')) },
			unselectAllMultiSelected: jest.fn(),
		}

		await list.methods.deleteAllMultiSelected.call(vm)

		expect(vm.$store.dispatch).toHaveBeenCalledTimes(1)
		expect(vm.$router.replace).toHaveBeenCalledWith({
			name: 'group',
			params: { selectedGroup: 'All contacts' },
		})
		expect(order).toEqual(['deleted', 'navigated'])
	})

	test('keeps the route when the open contact is read only', async () => {
		const vm = {
			...routerContext({ selectedGroup: 'All contacts', selectedContact: 'bob.vcf~contacts' }),
			multiSelectedContacts: new Map([
				[0, { key: 'alice.vcf~contacts', addressbook: { readOnly: false } }],
				[1, { key: 'bob.vcf~contacts', addressbook: { readOnly: true } }],
			]),
			showDeleteConfirmationDialog: true,
			$store: { dispatch: jest.fn().mockResolvedValue(undefined) },
			$router: { replace: jest.fn() },
			unselectAllMultiSelected: jest.fn(),
		}

		await list.methods.deleteAllMultiSelected.call(vm)

		expect(vm.$router.replace).not.toHaveBeenCalled()
	})

	test('keeps the route when the open contact is not part of a multi selection', async () => {
		const vm = {
			...routerContext({ selectedGroup: 'All contacts', selectedContact: 'bob.vcf~contacts' }),
			multiSelectedContacts: new Map([
				[0, { key: 'alice.vcf~contacts', addressbook: { readOnly: false } }],
			]),
			showDeleteConfirmationDialog: true,
			$store: { dispatch: jest.fn().mockResolvedValue(undefined) },
			$router: { replace: jest.fn() },
			unselectAllMultiSelected: jest.fn(),
		}

		await list.methods.deleteAllMultiSelected.call(vm)

		expect(vm.$router.replace).not.toHaveBeenCalled()
	})
})
