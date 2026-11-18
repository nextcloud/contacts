/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/vue', () => ({ NcAppSettingsDialog: {}, NcAppSettingsSection: {} }), { virtual: true })
jest.mock('@nextcloud/vue/components/NcFormBox', () => ({}), { virtual: true })
jest.mock('@nextcloud/vue/components/NcFormBoxCopyButton', () => ({}), { virtual: true })
jest.mock('@nextcloud/vue/components/NcFormBoxSwitch', () => ({}), { virtual: true })
jest.mock('@nextcloud/vue/components/NcFormGroup', () => ({}), { virtual: true })
jest.mock('@nextcloud/router', () => ({
	generateRemoteUrl: (path) => `https://cloud.example.com/remote.php/${path}`,
	generateUrl: (path) => path,
}), { virtual: true })
jest.mock('@nextcloud/initial-state', () => ({ loadState: jest.fn((app, key, fallback) => fallback) }))
jest.mock('@nextcloud/dialogs', () => ({ showError: jest.fn(), showSuccess: jest.fn() }), { virtual: true })
jest.mock('../../../src/components/AppNavigation/Settings/SettingsAddressbook.vue', () => ({}))
jest.mock('../../../src/components/AppNavigation/Settings/SettingsImportContacts.vue', () => ({}))
jest.mock('../../../src/components/AppNavigation/Settings/SettingsNewAddressbook.vue', () => ({}))
jest.mock('../../../src/components/AppNavigation/Settings/SettingsSortContacts.vue', () => ({}))
jest.mock('../../../src/store/principals.js', () => ({}))

// eslint-disable-next-line import/first
import ContactsSettings from '../../../src/components/AppNavigation/ContactsSettings.vue'

const { primaryCardDAV, appleCardDAV } = ContactsSettings.computed

describe('ContactsSettings CardDAV URLs', () => {
	test('primary CardDAV URL is the DAV root', () => {
		expect(primaryCardDAV.call({})).toBe('https://cloud.example.com/remote.php/dav')
	})

	test('Apple CardDAV URL is the absolute principal URL', () => {
		const vm = {
			currentUserPrincipal: { url: '/remote.php/dav/principals/users/alice/' },
			primaryCardDAV: 'https://cloud.example.com/remote.php/dav',
		}
		expect(appleCardDAV.call(vm)).toBe('https://cloud.example.com/remote.php/dav/principals/users/alice/')
	})

	test('Apple CardDAV URL is empty without a principal', () => {
		expect(appleCardDAV.call({ currentUserPrincipal: null })).toBe('')
	})
})
