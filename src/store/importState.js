/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const state = {
	importState: {
		total: 0,
		accepted: 0,
		denied: 0,
		stage: 'default',
		addressbook: '',
	},
}

const mutations = {
	/**
	 * Increment the number of contacts accepted
	 *
	 * @param {object} state the store data
	 */
	incrementAccepted(state) {
		state.importState.accepted++
	},

	/**
	 * Increment the number of contacts denied
	 *
	 * @param {object} state the store data
	 */
	incrementDenied(state) {
		state.importState.denied++
	},

	/**
	 * Set the total number of contacts
	 *
	 * @param {object} state the store data
	 * @param {string} total the total number of contacts to import
	 */
	setTotal(state, total) {
		state.importState.total = total
	},

	/**
	 * Set the address book name
	 *
	 * @param {object} state the store data
	 * @param {string} addressbook the name of the address book to import into
	 */
	setAddressbook(state, addressbook) {
		state.importState.addressbook = addressbook
	},

	/**
	 * Change stage to the indicated one
	 *
	 * @param {object} state the store data
	 * @param {string} stage the name of the stage ('default', 'importing', 'parsing', 'done')
	 */
	changeStage(state, stage) {
		state.importState.stage = stage
	},

	/**
	 * Reset to the default state
	 *
	 * @param {object} state the store data
	 */
	resetState(state) {
		state.importState.total = 0
		state.importState.accepted = 0
		state.importState.denied = 0
	},
}

const getters = {
	getImportState: state => state.importState,
}

const actions = {
	/**
	 * Increment the number of contacts accepted
	 *
	 * @param {object} context the store mutations
	 */
	incrementAccepted(context) {
		context.commit('incrementAccepted')
	},

	/**
	 * Increment the number of contacts denied
	 *
	 * @param {object} context the store mutations
	 */
	incrementDenied(context) {
		context.commit('incrementDenied')
	},

	/**
	 * Set the total number of contacts
	 *
	 * @param {object} context the store mutations
	 * @param {string} total the total number of contacts to import
	 */
	setTotal(context, total) {
		context.commit('setTotal', total)
	},

	/**
	 * Set the address book name
	 *
	 * @param {object} context the store mutations
	 * @param {string} addressbook the name of the address book to import into
	 */
	setAddressbook(context, addressbook) {
		context.commit('setAddressbook', addressbook)
	},

	/**
	 * Change stage to the indicated one
	 * and reset if the parsing starts
	 *
	 * @param {object} context the store mutations
	 * @param {string} stage the name of the stage ('default', 'importing', 'parsing', 'done')
	 */
	changeStage(context, stage) {
		context.commit('changeStage', stage)
		if (stage === 'parsing') {
			context.commit('resetState')
		}
	},
}

export default { state, mutations, getters, actions }
