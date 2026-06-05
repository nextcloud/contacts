/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/axios', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
	},
}))

jest.mock('@nextcloud/router', () => ({
	__esModule: true,
	generateUrl: (path, params = {}) => {
		let result = path
		for (const [key, value] of Object.entries(params)) {
			result = result.replaceAll(`{${key}}`, encodeURIComponent(String(value)))
		}
		return result
	},
}))

import axios from '@nextcloud/axios'
import { createPinia, setActivePinia } from 'pinia'

import { toOcmInviteEntry } from '../../../src/models/ocminvite.ts'
import useOcmInvitesStore from '../../../src/store/ocminvites.ts'

const TOKEN = 'token-1234'

const flatInvitePayload = (overrides = {}) => ({
	accepted: false,
	acceptedAt: null,
	createdAt: 1_800_000_000,
	expiredAt: 1_800_000_000 + 2_592_000,
	recipientEmail: 'recipient@example.org',
	recipientName: null,
	recipientProvider: null,
	recipientUserId: null,
	token: TOKEN,
	userId: 'alice',
	...overrides,
})

describe('ocminvites store', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		setActivePinia(createPinia())
	})

	describe('attachEmailAndSendOcmInvite', () => {
		test('PATCHes the per-invite email endpoint with the email and message payload', async () => {
			axios.patch.mockResolvedValue({ data: flatInvitePayload() })

			const store = useOcmInvitesStore()
			await store.attachEmailAndSendOcmInvite({
				token: TOKEN,
				email: 'recipient@example.org',
				message: 'hello',
			})

			expect(axios.patch).toHaveBeenCalledTimes(1)
			const [url, payload] = axios.patch.mock.calls[0]
			expect(url).toBe(`/apps/contacts/ocm/invitations/${TOKEN}/email`)
			expect(payload).toEqual({
				email: 'recipient@example.org',
				message: 'hello',
			})
		})

		test('coerces missing email and message to empty strings', async () => {
			axios.patch.mockResolvedValue({ data: flatInvitePayload() })

			const store = useOcmInvitesStore()
			await store.attachEmailAndSendOcmInvite({ token: TOKEN })

			const [, payload] = axios.patch.mock.calls[0]
			expect(payload).toEqual({ email: '', message: '' })
		})

		test('stores a fresh invite entry from a flat backend response', async () => {
			axios.patch.mockResolvedValue({ data: flatInvitePayload() })

			const store = useOcmInvitesStore()
			const response = await store.attachEmailAndSendOcmInvite({
				token: TOKEN,
				email: 'recipient@example.org',
				message: '',
			})

			expect(response.data.token).toBe(TOKEN)
			const stored = store.ocmInvites[TOKEN]
			expect(stored.key).toBe(TOKEN)
			expect(stored.token).toBe(TOKEN)
			expect(stored.recipientEmail).toBe('recipient@example.org')
			expect(store.sortedOcmInvites).toHaveLength(1)
			expect(store.sortedOcmInvites[0].key).toBe(TOKEN)
		})

		test('rethrows when the request fails and leaves state untouched', async () => {
			const failure = new Error('boom')
			axios.patch.mockRejectedValue(failure)

			const store = useOcmInvitesStore()
			await expect(
				store.attachEmailAndSendOcmInvite({
					token: TOKEN,
					email: 'recipient@example.org',
					message: '',
				}),
			).rejects.toBe(failure)

			expect(store.ocmInvites).toEqual({})
			expect(store.sortedOcmInvites).toEqual([])
		})
	})

	describe('fetchOcmInvites', () => {
		test('replaces existing invite map with latest server payload', async () => {
			axios.get.mockResolvedValue({
				data: [flatInvitePayload({ token: 'fresh-token', recipientEmail: 'fresh@example.org' })],
			})

			const store = useOcmInvitesStore()
			store.ocmInvites = {
				'stale-token': toOcmInviteEntry(flatInvitePayload({ token: 'stale-token', recipientEmail: 'stale@example.org' })),
			}

			await store.fetchOcmInvites()

			expect(Object.keys(store.ocmInvites)).toEqual(['fresh-token'])
			expect(store.ocmInvites['fresh-token'].recipientEmail).toBe('fresh@example.org')
			expect(store.inviteListStatus).toBe('success')
			expect(store.inviteListError).toBeNull()
		})

		test('sorts by recipientEmail value, not token key', async () => {
			axios.get.mockResolvedValue({
				data: [
					flatInvitePayload({ token: 'z-token', recipientEmail: 'zeta@example.org' }),
					flatInvitePayload({ token: 'a-token', recipientEmail: 'alpha@example.org' }),
				],
			})

			const store = useOcmInvitesStore()
			await store.fetchOcmInvites()

			expect(store.sortedOcmInvites.map(entry => entry.key)).toEqual(['a-token', 'z-token'])
			expect(store.inviteListStatus).toBe('success')
			expect(store.inviteListError).toBeNull()
		})

		test('rethrows and sets error state when request fails', async () => {
			const failure = new Error('network down')
			axios.get.mockRejectedValue(failure)

			const store = useOcmInvitesStore()
			await expect(store.fetchOcmInvites()).rejects.toBe(failure)

			expect(store.inviteListStatus).toBe('error')
			expect(store.inviteListError).toContain('network down')
		})

		test('rejects malformed payloads and sets error state', async () => {
			axios.get.mockResolvedValue({ data: { invalid: true } })

			const store = useOcmInvitesStore()
			await expect(store.fetchOcmInvites()).rejects.toThrow('Invalid invite list payload from server')

			expect(store.inviteListStatus).toBe('error')
			expect(store.inviteListError).toBe('Invalid invite list payload from server')
		})
	})

	describe('updateOcmInvite action', () => {
		test('replaces the invite for the matching token without dropping others', () => {
			const store = useOcmInvitesStore()
			store.ocmInvites = {
				'other-token': toOcmInviteEntry({ token: 'other-token', recipientEmail: 'other@example.org' }),
			}

			store.updateOcmInvite(flatInvitePayload({ recipientEmail: 'fresh@example.org' }))

			expect(Object.keys(store.ocmInvites)).toEqual(expect.arrayContaining(['other-token', TOKEN]))
			expect(store.ocmInvites[TOKEN].recipientEmail).toBe('fresh@example.org')
			expect(store.ocmInvites['other-token'].recipientEmail).toBe('other@example.org')
		})

		test('ignores payloads without a token and never mutates state', () => {
			const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
			const store = useOcmInvitesStore()

			store.updateOcmInvite({ recipientEmail: 'no-token@example.org' })

			expect(store.ocmInvites).toEqual({})
			expect(errorSpy).toHaveBeenCalled()
			errorSpy.mockRestore()
		})
	})

	describe('removeOcmInvite action', () => {
		test('removes only the targeted invite from the sorted list', () => {
			const a = toOcmInviteEntry({ token: 'a' })
			const b = toOcmInviteEntry({ token: 'b' })
			const store = useOcmInvitesStore()
			store.ocmInvites = { a, b }
			store.sortedOcmInvites = [a, b]

			store.removeOcmInvite('a')

			expect(store.sortedOcmInvites.map(i => i.key)).toEqual(['b'])
			expect(store.ocmInvites).not.toHaveProperty('a')
			expect(store.ocmInvites).toHaveProperty('b')
		})

		test('does not splice the last entry when the key is unknown', () => {
			const a = toOcmInviteEntry({ token: 'a' })
			const b = toOcmInviteEntry({ token: 'b' })
			const store = useOcmInvitesStore()
			store.ocmInvites = { a, b }
			store.sortedOcmInvites = [a, b]

			store.removeOcmInvite('missing-key')

			expect(store.sortedOcmInvites.map(i => i.key)).toEqual(['a', 'b'])
			expect(store.ocmInvites).toEqual({ a, b })
		})
	})

	describe('deleteOcmInvite', () => {
		test('throws when revoke request fails', async () => {
			const failure = new Error('delete failed')
			axios.delete.mockRejectedValue(failure)

			const store = useOcmInvitesStore()
			const invite = toOcmInviteEntry(flatInvitePayload())
			await expect(store.deleteOcmInvite(invite)).rejects.toBe(failure)
		})
	})

	describe('create/resend behavior', () => {
		test('newOcmInvite refreshes invite list after create', async () => {
			axios.post.mockResolvedValue({ data: { invite: '/invite/link' } })
			axios.get.mockResolvedValue({ data: [flatInvitePayload({ token: 'new-token' })] })

			const store = useOcmInvitesStore()
			await store.newOcmInvite({
				email: 'recipient@example.org',
				message: 'See you soon',
				note: 'CERN contact',
				ccSender: true,
			})

			expect(axios.post).toHaveBeenCalledTimes(1)
			expect(axios.post).toHaveBeenCalledWith('/apps/contacts/ocm/invitations', {
				email: 'recipient@example.org',
				message: 'See you soon',
				note: 'CERN contact',
				ccSender: true,
			})
			expect(axios.get).toHaveBeenCalledTimes(1)
			expect(store.ocmInvites['new-token']).toBeDefined()
		})

		test('newOcmInvite defaults optional create payload fields', async () => {
			axios.post.mockResolvedValue({ data: { invite: '/invite/link' } })
			axios.get.mockResolvedValue({ data: [] })

			const store = useOcmInvitesStore()
			await store.newOcmInvite({})

			expect(axios.post).toHaveBeenCalledWith('/apps/contacts/ocm/invitations', {
				email: '',
				message: '',
				note: '',
				ccSender: false,
			})
		})

		test('resendOcmInvite returns resend response without reloading invites', async () => {
			const resendResponse = { data: { invite: '/invite/link' } }
			axios.patch.mockResolvedValue(resendResponse)

			const store = useOcmInvitesStore()
			const invite = toOcmInviteEntry(flatInvitePayload())
			await expect(store.resendOcmInvite(invite)).resolves.toBe(resendResponse)

			expect(axios.patch).toHaveBeenCalledTimes(1)
			expect(axios.get).not.toHaveBeenCalled()
		})

		test('newOcmInvite resolves when refresh fetch fails', async () => {
			const failure = new Error('refresh failed')
			const createResponse = { data: { invite: '/invite/link' } }
			axios.post.mockResolvedValue(createResponse)
			axios.get.mockRejectedValue(failure)

			const store = useOcmInvitesStore()
			await expect(store.newOcmInvite({ email: 'recipient@example.org', message: '', note: '' })).resolves.toBe(createResponse)

			expect(store.inviteListStatus).toBe('error')
			expect(store.inviteListError).toContain('refresh failed')
		})

		test('newOcmInvite rejects when create request fails', async () => {
			const failure = new Error('create failed')
			axios.post.mockRejectedValue(failure)

			const store = useOcmInvitesStore()
			await expect(store.newOcmInvite({ email: 'recipient@example.org', message: '', note: '' })).rejects.toBe(failure)

			expect(axios.get).not.toHaveBeenCalled()
		})

		test('resendOcmInvite rejects when resend request fails', async () => {
			const failure = new Error('resend failed')
			axios.patch.mockRejectedValue(failure)

			const store = useOcmInvitesStore()
			const invite = toOcmInviteEntry(flatInvitePayload())
			await expect(store.resendOcmInvite(invite)).rejects.toBe(failure)

			expect(axios.get).not.toHaveBeenCalled()
		})
	})
})
