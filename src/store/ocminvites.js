/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import logger from '../services/logger.js'
import OcmInvite from '../models/ocminvite.ts'

const sortData = (a, b) => {
	return a.key.localeCompare(b.key)
}

const state = {
	// Using objects for performance
	// https://codepen.io/skjnldsv/pen/ZmKvQo
	ocmInvites: {},
	sortedOcmInvites: [],
	orderKey: 'recipientEmail',
}

const getters = {
	getOcmInvite: (state) => (key) => state.ocmInvites[key],
	getOcmInvites: state => state.ocmInvites,
	getSortedOcmInvites: state => state.sortedOcmInvites,
}

const actions = {
    fetchOcmInvites(context) {
		axios.get(generateUrl('/apps/contacts/ocm/invitations'))
			.then(response => {
				context.commit('appendInvites', response.data)
				context.commit('sortInvites', response.data)
			})
			.catch((error) => {
				logger.error('Error fetching OCM invites: ' + error)
			})
    },
    async deleteOcmInvite(context, invite) {
		const token = invite.token
		const url = generateUrl('/apps/contacts/ocm/invitations/{token}', { token: token })
		axios.delete(url)
			.then(response => {
				context.commit('deleteOcmInvite', invite.key)
			})
			.catch((error) => {
				logger.error('Error deleting OCM invite with token ' + token)
			})
    },
    async resendOcmInvite(context, invite) {
		const token = invite.token
		const url = generateUrl('/apps/contacts/ocm/invitations/{token}/resend', { token: token })
		const response = await axios.patch(url)
			.then(response => {
				return response
			})
			.catch((error) => {
				logger.error('Error resending OCM invite with token ' + token)
				throw error
			})
		return response
    },
	async newOcmInvite(context, invite) {
		const url = generateUrl('/apps/contacts/ocm/invitations')
		const response = await axios.post(url, invite)
			.then(response => {
				return response
			})
			.catch((error) => {
				logger.error('Error creating a new OCM invite for ' + invite.email)
				throw error
			})
		return response
	}
}

const mutations = {

	/**
	 * Store raw OCM invites into state
	 * Used by the first invite fetch
	 *
	 * @param {object} state Default state
	 * @param {Array<OcmInvite>} invites OCM invites
	 */
	appendInvites(state, invites = [] ) {
		state.ocmInvites = invites.reduce(function(list, _invite) {
			const invite = new OcmInvite(_invite)
			if (invite.token) { // we should at least have a token
				list[invite.key] = invite
			} else {
				console.error('Invalid invite object', invite)
			}
			return list
		}, state.ocmInvites)
	},
	/**
	 * Sort the OCM invites list. Filters have terrible performances.
	 * We do not want to run the sorting function every time.
	 * Let's only run it on additions and create an index
	 *
	 * @param {object} state the store data
	 */
	sortInvites(state) {
		state.sortedOcmInvites = Object.values(state.ocmInvites)
			.map(invite => { return { key: invite.key, value: invite[state.orderKey] } })
			.sort(sortData)
	},

	/**
	 * Deletes the invite with the specified key from the OCM invites list
	 * 
	 * @param {object} state
	 * @param {string} key
	 */
	deleteOcmInvite(state, key) {
		const index = state.sortedOcmInvites.findIndex(search => search.key === key)
		state.sortedOcmInvites.splice(index, 1)
		delete state.ocmInvites[key]
	}
}

export default { state, getters, actions, mutations }
