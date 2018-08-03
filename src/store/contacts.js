/**
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
	contacts: {},
	sortedContacts: [],
	orderKey: 'displayName'
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
		let index = state.sortedContacts.findIndex(search => search.key === contact.key)
		state.sortedContacts.splice(index, 1)
		Vue.delete(state.contacts, contact.key)
	},

	/**
	 * Insert new contact into sorted array
	 * Not using sort, splice has far better performances
	 * https://jsperf.com/sort-vs-splice-in-array
	 *
	 * @param {Object} state
	 * @param {Contact} contact
	 */
	addContact(state, contact) {
		let sortedContact = {
			key: contact.key,
			value: contact[state.orderKey]
		}
		for (var i = 0, len = state.sortedContacts.length; i < len; i++) {
			var nameA = state.sortedContacts[i].value.toUpperCase()	// ignore upper and lowercase
			var nameB = sortedContact.value.toUpperCase()			// ignore upper and lowercase
			if (nameA.localeCompare(nameB) > 0) {
				state.sortedContacts.splice(i, 0, sortedContact)
				break
			}
		}
		Vue.set(state.contacts, contact.key, contact)
	},

	/**
	 * Order the contacts list. Filters have terrible performances.
	 * We do not want to run the sorting function every time.
	 * Let's only run it on additions and create an index
	 *
	 * @param {Object} state
	 */
	async sortContacts(state) {
		state.sortedContacts = Object.values(state.contacts)
			// exclude groups
			.filter(contact => contact.kind !== 'group')
			.map(contact => { return { key: contact.key, value: contact[state.orderKey] } })
			.sort((a, b) => {
				var nameA = a.value.toUpperCase() // ignore upper and lowercase
				var nameB = b.value.toUpperCase() // ignore upper and lowercase
				return nameA.localeCompare(nameB)
			})
	},

	/**
	 * Set the order key
	 *
	 * @param {Object} state
	 * @param {string} [orderKey='displayName']
	 */
	setOrder(state, orderKey = 'displayName') {
		state.orderKey = orderKey
	}

}

const getters = {
	getContacts: state => state.contacts,
	getSortedContacts: state => state.sortedContacts,
	getContact: (state) => (uid) => state.contacts[uid],
	getOrderKey: state => state.orderKey
}

const actions = {
	deleteContact(context, contact) {
		context.commit('deleteContact', contact)
		context.commit('deleteContactFromAddressbook', contact)
	}
}

export default { state, mutations, getters, actions }
