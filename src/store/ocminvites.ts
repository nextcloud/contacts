/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { OcmInviteData, OcmInviteEntry } from '../models/ocminvite.ts'

import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { defineStore } from 'pinia'
import { toOcmInviteEntry } from '../models/ocminvite.ts'
import logger from '../services/logger.js'

interface SortedEntry {
	key: string
	value: string | number | boolean | undefined
}

interface OcmInvitesState {
	ocmInvites: Record<string, OcmInviteEntry>
	sortedOcmInvites: SortedEntry[]
	orderKey: keyof OcmInviteData
	inviteListStatus: 'idle' | 'loading' | 'success' | 'error'
	inviteListError: string | null
}

interface NewInvitePayload {
	email?: string
	message?: string
	note?: string
	ccSender?: boolean
}

interface AttachEmailPayload {
	token: string
	email?: string
	message?: string
}

function getSortValue(value: SortedEntry['value']): string {
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value)
	}
	if (typeof value === 'string') {
		return value.toLowerCase()
	}
	return ''
}

function sortData(a: SortedEntry, b: SortedEntry): number {
	const byValue = getSortValue(a.value).localeCompare(getSortValue(b.value), undefined, { numeric: true })
	if (byValue !== 0) {
		return byValue
	}
	return a.key.localeCompare(b.key)
}

const useOcmInvitesStore = defineStore('ocminvites', {
	state: (): OcmInvitesState => ({
		// Object-keyed map for O(1) lookups; the sortedOcmInvites array
		// keeps a precomputed display order so list views do not pay the
		// cost of resorting on every render.
		// https://codepen.io/skjnldsv/pen/ZmKvQo
		ocmInvites: {},
		sortedOcmInvites: [],
		orderKey: 'recipientEmail',
		inviteListStatus: 'idle',
		inviteListError: null,
	}),

	getters: {
		getOcmInvite: (state) => (key: string): OcmInviteEntry | undefined => state.ocmInvites[key],
	},

	actions: {
		async fetchOcmInvites(): Promise<void> {
			this.inviteListStatus = 'loading'
			this.inviteListError = null
			try {
				const response = await axios.get(generateUrl('/apps/contacts/ocm/invitations'))
				if (!Array.isArray(response.data)) {
					throw new Error('Invalid invite list payload from server')
				}
				const invites = response.data
				this.replaceInvites(invites)
				this.sortInvites()
				this.inviteListStatus = 'success'
			} catch (error) {
				this.inviteListStatus = 'error'
				this.inviteListError = error instanceof Error ? error.message : String(error)
				logger.error('Error fetching OCM invites: ' + error)
				throw error
			}
		},

		async deleteOcmInvite(invite: OcmInviteEntry): Promise<void> {
			const token = invite.token
			const url = generateUrl('/apps/contacts/ocm/invitations/{token}', { token })
			try {
				await axios.delete(url)
				this.removeOcmInvite(invite.key)
			} catch (error) {
				logger.error('Error deleting OCM invite with token ' + token)
				throw error
			}
		},

		async resendOcmInvite(invite: OcmInviteEntry) {
			const token = invite.token
			const url = generateUrl('/apps/contacts/ocm/invitations/{token}/resend', { token })
			try {
				return await axios.patch(url)
			} catch (error) {
				logger.error('Error resending OCM invite with token ' + token)
				throw error
			}
		},

		async newOcmInvite(invite: NewInvitePayload) {
			const url = generateUrl('/apps/contacts/ocm/invitations')
			const payload = {
				email: invite.email || '',
				message: invite.message || '',
				note: invite.note || '',
				ccSender: invite.ccSender || false,
			}
			let response
			try {
				response = await axios.post(url, payload)
			} catch (error) {
				logger.error('Error creating a new OCM invite for ' + invite.email)
				throw error
			}
			try {
				await this.fetchOcmInvites()
			} catch (error) {
				logger.error('Invite created but refresh failed for ' + invite.email)
			}
			return response
		},

		async attachEmailAndSendOcmInvite({ token, email, message }: AttachEmailPayload) {
			const url = generateUrl('/apps/contacts/ocm/invitations/{token}/email', { token })
			const payload = {
				email: email || '',
				message: message || '',
			}
			let response
			try {
				response = await axios.patch(url, payload)
			} catch (error) {
				logger.error('Error attaching email to OCM invite with token ' + token)
				throw error
			}
			if (response?.data) {
				this.updateOcmInvite(response.data)
			}
			return response
		},

		/**
		 * Stores a fresh batch of raw invite payloads from the API. Skips
		 * any entry without a token because we cannot key it.
		 */
		replaceInvites(invites: OcmInviteData[] = []): void {
			this.ocmInvites = invites.reduce<Record<string, OcmInviteEntry>>((list, raw) => {
				const entry = toOcmInviteEntry(raw)
				if (entry) {
					list[entry.key] = entry
				} else {
					logger.error('Invalid invite object received from API', { raw })
				}
				return list
			}, {})
		},

		/**
		 * Recomputes the sorted index from the current invite map.
		 * Filtering with computed properties was too slow on large
		 * lists; a precomputed index is cheap to read and only refreshed
		 * on writes.
		 */
		sortInvites(): void {
			const invites = Object.values(this.ocmInvites) as OcmInviteEntry[]
			this.sortedOcmInvites = invites
				.map((invite) => ({ key: invite.key, value: invite[this.orderKey] }))
				.sort(sortData)
		},

		removeOcmInvite(key: string): void {
			const index = this.sortedOcmInvites.findIndex((entry) => entry.key === key)
			if (index !== -1) {
				this.sortedOcmInvites.splice(index, 1)
			}
			delete this.ocmInvites[key]
		},

		/**
		 * Replaces a single cached invite with a fresh server payload,
		 * keyed by token.
		 */
		updateOcmInvite(raw: OcmInviteData): void {
			const entry = toOcmInviteEntry(raw)
			if (!entry) {
				logger.error('Invalid invite object received from API', { raw })
				return
			}
			this.ocmInvites = { ...this.ocmInvites, [entry.key]: entry }
			this.sortInvites()
		},
	},
})

export default useOcmInvitesStore
