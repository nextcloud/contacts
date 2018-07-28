/*
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import Vue from 'vue'

const state = {
	// Using objects for performance
	// https://jsperf.com/ensure-unique-id-objects-vs-array
	contacts: {}
}
const mutations = {

	/**
	 * Store contacts into state
	 *
	 * @param {Object} state Default state
	 * @param {Array} contacts Contacts
	 */
	async appendContacts(state, contacts = []) {
		state.contacts = contacts.reduce(function(list, contact) {
			Vue.set(list, contact.key, contact)
			return list
		}, state.contacts)
	},

	/**
	 * Delete a contact from the global contacts list
	 *
	 * @param {Object} state
	 * @param {Contact} contact
	 */
	deleteContact(state, contact) {
		Vue.delete(state.contacts, contact.key)
	},

	/**
	 * Order the contacts list. Filters have terrible performances.
	 * We do not want to run the sorting function every time.
	 * Let's only run it on additions
	 *
	 * @param {Object} state
	 * @param {String} orderKey
	 */
	async sortContacts(state, orderKey = 'displayName') {
		state.contacts = Object.values(state.contacts)
			.sort((a, b) => {
				var nameA = a[orderKey].toUpperCase() // ignore upper and lowercase
				var nameB = b[orderKey].toUpperCase() // ignore upper and lowercase
				return nameA.localeCompare(nameB)
			})
			.reduce((list, contact) => {
				Vue.set(list, contact.key, contact)
				return list
			}, {})
	}

}
const getters = {
	getContacts: state => state.contacts,
	getContact: (state) => (uid) => state.contacts[uid]
}
const actions = {
	deleteContact(context, contact) {
		context.commit('deleteContact', contact)
		context.commit('deleteContactFromAddressbook', contact)
	}
}

export default { state, mutations, getters, actions }
