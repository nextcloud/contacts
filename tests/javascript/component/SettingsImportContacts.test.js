/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/vue', () => ({ NcButton: {} }), { virtual: true })
jest.mock('@nextcloud/paths', () => ({ encodePath: (path) => path }), { virtual: true })
jest.mock('@nextcloud/router', () => ({
	generateRemoteUrl: (path) => `/remote/${path}`,
	generateOcsUrl: (path) => `/ocs${path}`,
}), { virtual: true })
jest.mock('@nextcloud/dialogs', () => ({ showError: jest.fn(), showSuccess: jest.fn(), showWarning: jest.fn() }), { virtual: true })
jest.mock('@nextcloud/auth', () => ({ getCurrentUser: () => ({ uid: 'admin' }) }), { virtual: true })
jest.mock('../../../src/components/AppNavigation/Settings/ImportScreen.vue', () => ({}))
jest.mock('vue-material-design-icons/AlertCircleOutline.vue', () => ({}))
jest.mock('vue-material-design-icons/UploadOutline.vue', () => ({}))

// eslint-disable-next-line import/first
import SettingsImportContacts from '../../../src/components/AppNavigation/Settings/SettingsImportContacts.vue'

const { resolveTarget } = SettingsImportContacts.methods

/**
 * Build a queued import entry.
 *
 * @param {string|null} addressbookId selected destination id
 * @return {object}
 */
function entry(addressbookId) {
	return {
		file: { id: 1, name: 'contacts.vcf', parser: { getName: () => null } },
		addressbookId,
		options: { format: 'ical', supersede: false },
	}
}

describe('SettingsImportContacts.resolveTarget', () => {
	test('returns an existing address book by id', async () => {
		const ctx = {
			$store: { getters: { getAddressbooks: [{ id: 'ab-1', displayName: 'Work' }] }, dispatch: jest.fn() },
			importStore: { setAddressbookForFile: jest.fn() },
		}

		const target = await resolveTarget.call(ctx, entry('ab-1'))

		expect(target).toEqual({ id: 'ab-1', displayName: 'Work' })
		expect(ctx.$store.dispatch).not.toHaveBeenCalled()
	})

	test('throws when the selected address book no longer exists', async () => {
		const ctx = {
			$store: { getters: { getAddressbooks: [] }, dispatch: jest.fn() },
			importStore: { setAddressbookForFile: jest.fn() },
		}

		await expect(resolveTarget.call(ctx, entry('missing'))).rejects.toThrow()
	})

	test('creates a new address book when "new" is selected', async () => {
		const addressbooks = [{ id: 'ab-1', displayName: 'Work' }]
		const ctx = {
			$store: {
				getters: { getAddressbooks: addressbooks },
				dispatch: jest.fn().mockImplementation((action) => {
					if (action === 'appendAddressbook') {
						addressbooks.push({ id: 'ab-new', displayName: 'Imported' })
					}
					return Promise.resolve()
				}),
			},
			importStore: { setAddressbookForFile: jest.fn() },
		}

		const target = await resolveTarget.call(ctx, entry('new'))

		expect(ctx.$store.dispatch).toHaveBeenCalledWith('appendAddressbook', { displayName: expect.any(String) })
		expect(target.id).toBe('ab-new')
		expect(ctx.importStore.setAddressbookForFile).toHaveBeenCalledWith({ fileId: 1, addressbookId: 'ab-new' })
	})
})
