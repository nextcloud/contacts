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
jest.mock('../../../src/services/importService.ts', () => ({
	__esModule: true,
	isStreamImportSupported: jest.fn(),
}))

// eslint-disable-next-line import/first
import SettingsImportContacts from '../../../src/components/AppNavigation/Settings/SettingsImportContacts.vue'
// eslint-disable-next-line import/first
import { isStreamImportSupported } from '../../../src/services/importService.ts'
// eslint-disable-next-line import/first
import { IMPORT_NEW_ADDRESSBOOK_ID } from '../../../src/models/constants.ts'

const { resolveTarget, validateFile } = SettingsImportContacts.methods
const { supportedFileTypes } = SettingsImportContacts.computed

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
		const addressbook = { id: 'ab-1', displayName: 'Work' }
		const ctx = {
			$store: { getters: { getAddressbooks: [addressbook] }, dispatch: jest.fn() },
			importStore: { setAddressbookForFile: jest.fn() },
		}

		const target = await resolveTarget.call(ctx, entry('ab-1'))

		expect(target).toEqual({ id: 'ab-1', displayName: 'Work', addressbook })
		expect(ctx.$store.dispatch).not.toHaveBeenCalled()
	})

	test('throws when the selected address book no longer exists', async () => {
		const ctx = {
			$store: { getters: { getAddressbooks: [] }, dispatch: jest.fn() },
			importStore: { setAddressbookForFile: jest.fn() },
		}

		await expect(resolveTarget.call(ctx, entry('missing'))).rejects.toThrow()
	})

	test('imports into an existing address book whose id is "new"', async () => {
		const addressbook = { id: 'new', displayName: 'New' }
		const ctx = {
			$store: { getters: { getAddressbooks: [addressbook] }, dispatch: jest.fn() },
			importStore: { setAddressbookForFile: jest.fn() },
		}

		const target = await resolveTarget.call(ctx, entry('new'))

		expect(target).toEqual({ id: 'new', displayName: 'New', addressbook })
		expect(ctx.$store.dispatch).not.toHaveBeenCalled()
	})

	test('creates a new address book when "New address book" is selected', async () => {
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

		const target = await resolveTarget.call(ctx, entry(IMPORT_NEW_ADDRESSBOOK_ID))

		expect(ctx.$store.dispatch).toHaveBeenCalledWith('appendAddressbook', { displayName: expect.any(String) })
		expect(target.id).toBe('ab-new')
		expect(target.addressbook).toBe(addressbooks[1])
		expect(ctx.importStore.setAddressbookForFile).toHaveBeenCalledWith({ fileId: 1, addressbookId: 'ab-new' })
	})
})

describe('SettingsImportContacts file types', () => {
	beforeEach(() => {
		isStreamImportSupported.mockReset()
	})

	test('accepts vCard, jCard and xCard files when the server supports the import endpoint', () => {
		isStreamImportSupported.mockReturnValue(true)

		expect(supportedFileTypes.call({})).toContain('.json')
		expect(validateFile('contacts.vcf', 'BEGIN:VCARD\nEND:VCARD')).toBe(true)
		expect(validateFile('contacts.json', '["vcard",[]]')).toBe(true)
		expect(validateFile('contacts.xml', '<vcards/>')).toBe(true)
	})

	test('accepts only vCard files on older servers', () => {
		isStreamImportSupported.mockReturnValue(false)

		expect(supportedFileTypes.call({})).toBe('text/vcard,.vcf')
		expect(validateFile('contacts.vcf', 'BEGIN:VCARD\nEND:VCARD')).toBe(true)
		expect(validateFile('contacts.json', '["vcard",[]]')).toBe(false)
		expect(validateFile('contacts.xml', '<vcards/>')).toBe(false)
	})
})
