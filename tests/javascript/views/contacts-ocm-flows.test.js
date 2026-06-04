/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/auth', () => ({
	getCurrentUser: jest.fn(() => ({ uid: 'alice' })),
}))

jest.mock('@nextcloud/axios', () => ({
	__esModule: true,
	default: {
		patch: jest.fn(),
	},
}))

jest.mock('@nextcloud/dialogs', () => ({
	showError: jest.fn(),
}))

jest.mock('@nextcloud/event-bus', () => ({
	emit: jest.fn(),
}))

jest.mock('@nextcloud/initial-state', () => ({
	loadState: jest.fn((app, key, fallback) => fallback),
}))

jest.mock('@nextcloud/router', () => ({
	generateUrl: (path, params = {}) => {
		let result = path
		for (const [key, value] of Object.entries(params)) {
			result = result.replace(`{${key}}`, String(value))
		}
		return result
	},
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
jest.mock('../../../src/services/cdav.js', () => ({ default: {} }))
jest.mock('../../../src/services/isCirclesEnabled.js', () => ({ default: false }))
jest.mock('../../../src/services/isOcmInvitesEnabled.js', () => ({ default: true }))
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
jest.mock('vue-material-design-icons/Cancel.vue', () => ({ default: {} }))
jest.mock('vue-material-design-icons/Check.vue', () => ({ default: {} }))
jest.mock('vue-material-design-icons/Plus.vue', () => ({ default: {} }))

import axios from '@nextcloud/axios'
import { showError } from '@nextcloud/dialogs'
import Contacts from '../../../src/views/Contacts.vue'

const view = Contacts.default || Contacts

describe('Contacts OCM flow methods', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('sendNewInvite keeps draft modal open on create failure', async () => {
		const createFailure = { response: { data: { message: 'Could not create invite' } } }
		const vm = {
			loadingUpdate: false,
			showNewInviteForm: true,
			ocmInvite: { email: 'recipient@example.org', message: '', note: '', sendEmail: false },
			ocmInvitesConfig: { optionalMail: true },
			ocminvitesStore: {
				newOcmInvite: jest.fn().mockRejectedValue(createFailure),
			},
			cancelNewInvite: jest.fn(),
			t: (app, text) => text,
		}

		await view.methods.sendNewInvite.call(vm)

		expect(vm.cancelNewInvite).not.toHaveBeenCalled()
		expect(vm.showNewInviteForm).toBe(true)
		expect(showError).toHaveBeenCalledWith('Could not create invite')
		expect(vm.loadingUpdate).toBe(false)
	})

	test('sendNewInvite reports the short missing email message', async () => {
		const vm = {
			loadingUpdate: false,
			ocmInvite: { email: '', message: '', note: '', sendEmail: true },
			ocmInvitesConfig: { optionalMail: true },
			ocminvitesStore: {
				newOcmInvite: jest.fn(),
			},
			t: (app, text) => text,
		}

		await view.methods.sendNewInvite.call(vm)

		expect(showError).toHaveBeenCalledWith('Please enter an email address.')
		expect(vm.ocminvitesStore.newOcmInvite).not.toHaveBeenCalled()
		expect(vm.loadingUpdate).toBe(false)
	})

	test('sendNewInvite submits link-only invites with an empty email', async () => {
		const createFailure = { response: { data: { message: 'backend reached' } } }
		const vm = {
			loadingUpdate: false,
			ocmInvite: { email: '', message: 'hello', note: 'mesh peer', sendEmail: false },
			showNewInviteForm: true,
			ocminvitesStore: {
				newOcmInvite: jest.fn().mockRejectedValue(createFailure),
			},
			cancelNewInvite: jest.fn(),
			t: (app, text) => text,
		}

		await view.methods.sendNewInvite.call(vm)

		expect(vm.ocminvitesStore.newOcmInvite).toHaveBeenCalledWith(vm.ocmInvite)
		expect(vm.cancelNewInvite).not.toHaveBeenCalled()
		expect(showError).toHaveBeenCalledWith('backend reached')
		expect(showError).not.toHaveBeenCalledWith('Please enter an email address.')
		expect(vm.loadingUpdate).toBe(false)
	})

	test('handleAccept keeps manual modal open on failure', async () => {
		axios.patch.mockRejectedValueOnce({ response: { data: { message: 'manual accept failed' } } })
		const vm = {
			loadingUpdate: false,
			showManualInvite: true,
			t: (app, text) => text,
		}

		await view.methods.handleAccept.call(vm, {
			provider: 'provider.example',
			token: 'invite-token',
		})

		expect(vm.showManualInvite).toBe(true)
		expect(showError).toHaveBeenCalledWith('manual accept failed')
		expect(vm.loadingUpdate).toBe(false)
	})

	test('acceptInvite keeps deep-link dialog open on failure', async () => {
		axios.patch.mockRejectedValueOnce({ response: { data: { message: 'deep-link failed' } } })
		const vm = {
			loadingUpdate: false,
			showInviteAcceptDialog: true,
			inviteToken: 'invite-token',
			inviteProvider: 'provider.example',
			t: (app, text) => text,
		}

		await view.methods.acceptInvite.call(vm)

		expect(vm.showInviteAcceptDialog).toBe(true)
		expect(showError).toHaveBeenCalledWith('deep-link failed')
		expect(vm.loadingUpdate).toBe(false)
	})
})
