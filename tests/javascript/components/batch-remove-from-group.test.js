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
jest.mock('@nextcloud/dialogs', () => ({ showError: jest.fn() }))
jest.mock('@nextcloud/l10n', () => ({ ...jest.requireActual('@nextcloud/l10n'), t: (app, text) => text, n: (app, singular) => singular }))
jest.mock('ical.js', () => ({ design: { vcard: {}, vcard3: {} } }))
jest.mock('../../../src/services/validate.js', () => ({ default: jest.fn() }))
jest.mock('../../../src/services/removeContactFromGroup.js', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../../src/store/contacts.js', () => ({ default: {} }))

jest.mock('../../../src/components/ContactsList/ContactsListItem.vue', () => ({ default: {} }))
jest.mock('../../../src/components/ContactsList/Merging.vue', () => ({ default: {} }))
jest.mock('virtua/vue', () => ({ VList: {} }))

jest.mock('@mdi/svg/svg/cancel.svg?raw', () => ({ default: '' }), { virtual: true })
jest.mock('@mdi/svg/svg/delete-outline.svg', () => ({ default: '' }), { virtual: true })

import { showError } from '@nextcloud/dialogs'
import Batch from '../../../src/components/ContactsList/Batch.vue'
import ContactsList from '../../../src/components/ContactsList.vue'
import removeContactFromGroup from '../../../src/services/removeContactFromGroup.js'

const batch = Batch.default || Batch
const list = ContactsList.default || ContactsList

/**
 * Build a contact stub
 *
 * @param {string} key the contact key
 * @param {string[]} groups the contact groups
 * @param {boolean} canModifyCard whether the address book is writable
 * @return {object}
 */
function contact(key, groups, canModifyCard = true) {
	return { key, groups, addressbook: { canModifyCard } }
}

describe('Batch remove from group', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('removes only writable contacts that are in the group', async () => {
		removeContactFromGroup.mockResolvedValue(undefined)
		const member = contact('a', ['Team'])
		const vm = {
			contacts: [member, contact('b', ['Other']), contact('c', ['Team'], false), contact('d', undefined)],
			groupName: 'Team',
			$store: { dispatch: jest.fn() },
			$emit: jest.fn(),
		}

		await batch.methods.removeFromGroup.call(vm)

		expect(removeContactFromGroup).toHaveBeenCalledTimes(1)
		expect(removeContactFromGroup).toHaveBeenCalledWith(member, 'Team')
		expect(vm.$store.dispatch).toHaveBeenCalledTimes(1)
		expect(vm.$store.dispatch).toHaveBeenCalledWith('removeContactFromGroup', { contact: member, groupName: 'Team' })
		expect(vm.$emit).toHaveBeenCalledWith('submit')
	})

	test('keeps the contact in the store group and reports an error when the request fails', async () => {
		removeContactFromGroup.mockRejectedValue(new Error('network'))
		const vm = {
			contacts: [contact('a', ['Team'])],
			groupName: 'Team',
			$store: { dispatch: jest.fn() },
			$emit: jest.fn(),
		}

		await batch.methods.removeFromGroup.call(vm)

		expect(vm.$store.dispatch).not.toHaveBeenCalled()
		expect(showError).toHaveBeenCalledTimes(1)
		expect(vm.$emit).toHaveBeenCalledWith('submit')
	})
})

describe('Contacts list multi-selection', () => {
	test.each(['selectedGroup', 'selectedAddressbook'])('is cleared when %s changes', (watcher) => {
		const vm = {
			multiSelectedContacts: new Map([[0, contact('a', [])], [1, contact('b', [])]]),
			lastToggledIndex: 1,
			unselectAllMultiSelected: list.methods.unselectAllMultiSelected,
		}

		list.watch[watcher].call(vm)

		expect(vm.multiSelectedContacts.size).toBe(0)
		expect(vm.lastToggledIndex).toBeUndefined()
	})
})
