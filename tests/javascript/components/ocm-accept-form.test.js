/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/vue/components/NcButton', () => ({ default: {} }), { virtual: true })
jest.mock('@nextcloud/vue/components/NcLoadingIcon', () => ({ default: {} }), { virtual: true })
jest.mock('@nextcloud/vue/components/NcTextField', () => ({ default: {} }), { virtual: true })
jest.mock('vue-material-design-icons/Cancel.vue', () => ({ default: {} }), { virtual: true })
jest.mock('vue-material-design-icons/Check.vue', () => ({ default: {} }), { virtual: true })

import OcmAcceptForm from '../../../src/components/Ocm/OcmAcceptForm.vue'

const component = OcmAcceptForm.default || OcmAcceptForm

describe('OcmAcceptForm invite parser', () => {
	test('parses token@provider format', () => {
		const parsed = component.methods.parseInvite('token123@provider.example')
		expect(parsed).toEqual({
			token: 'token123',
			provider: 'provider.example',
		})
	})

	test('parses absolute invite URL format', () => {
		const parsed = component.methods.parseInvite('https://cloud.example/ocm/invite-accept-dialog?token=abc123&providerDomain=provider.example')
		expect(parsed).toEqual({
			token: 'abc123',
			provider: 'provider.example',
		})
	})

	test('parses encoded invite format', () => {
		const encoded = Buffer.from('token123@provider.example', 'utf8').toString('base64')
		const parsed = component.methods.parseInvite(encoded)
		expect(parsed).toEqual({
			token: 'token123',
			provider: 'provider.example',
		})
	})

	test('throws on invalid invite input', () => {
		expect(() => component.methods.parseInvite('not-an-invite')).toThrow('Could not parse invite')
	})
})
