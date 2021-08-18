/**
 * @copyright Copyright (c) 2018 Team Popcorn <teampopcornberlin@gmail.com>
 *
 * @author Team Popcorn <teampopcornberlin@gmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
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
