/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import logger from '../services/logger.js'
import OcmInvite from '../models/ocminvite.ts'
import Vue from 'vue'

const sortData = (a, b) => {
	const nameA = typeof a.value === 'string'
		? a.value.toUpperCase() // ignore upper and lowercase
		: a.value.toUnixTime() // only other sorting we support is a vCardTime
	const nameB = typeof b.value === 'string'
		? b.value.toUpperCase() // ignore upper and lowercase
		: b.value.toUnixTime() // only other sorting we support is a vCardTime

	const score = nameA.localeCompare
		? nameA.localeCompare(nameB)
		: nameB - nameA
	// if equal, fallback to the key
	return score !== 0
		? score
		: a.key.localeCompare(b.key)
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
    async fetchOcmInvites(context) {
		axios.get(generateUrl('/apps/contacts/ocm/invitations'))
			.then(response => {
				context.commit('appendInvites', response.data)
				context.commit('sortInvites', response.data)

			})
			.catch((error) => {
				logger.error('Error fetching OCM invites: ' + error)
			})
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
				Vue.set(list, invite.key, invite)
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
}

export default { state, getters, actions, mutations }
