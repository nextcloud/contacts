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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import Vue from 'vue'
import ICAL from 'ical.js'
import Contact from '../models/contact'
import validate from '../services/validate'

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
	contacts: {},
	sortedContacts: [],
	orderKey: 'displayName',
}

const mutations = {

	/**
	 * Store raw contacts into state
	 * Used by the first contact fetch
	 *
	 * @param {Object} state Default state
	 * @param {Array<Contact>} contacts Contacts
	 */
	appendContacts(state, contacts = []) {
		state.contacts = contacts.reduce(function(list, contact) {
			if (contact instanceof Contact) {
				Vue.set(list, contact.key, contact)
			} else {
				console.error('Invalid contact object', contact)
			}
			return list
		}, state.contacts)
	},

	/**
	 * Delete a contact from the global contacts list
	 *
	 * @param {Object} state the store data
	 * @param {Contact} contact the contact to delete
	 */
	deleteContact(state, contact) {
		if (state.contacts[contact.key] && contact instanceof Contact) {

			const index = state.sortedContacts.findIndex(search => search.key === contact.key)
			state.sortedContacts.splice(index, 1)
			Vue.delete(state.contacts, contact.key)

		} else {
			console.error('Error while deleting the following contact', contact)
		}
	},

	/**
	 * Insert new contact into sorted array
	 *
	 * @param {Object} state the store data
	 * @param {Contact} contact the contact to add
	 */
	addContact(state, contact) {
		if (contact instanceof Contact) {

			// Checking contact validity 🔍🙈
			validate(contact)

			const sortedContact = {
				key: contact.key,
				value: contact[state.orderKey],
			}

			// Not using sort, splice has far better performances
			// https://jsperf.com/sort-vs-splice-in-array
			for (let i = 0, len = state.sortedContacts.length; i < len; i++) {
				if (sortData(state.sortedContacts[i], sortedContact) >= 0) {
					state.sortedContacts.splice(i, 0, sortedContact)
					break
				} else if (i + 1 === len) {
					// we reached the end insert it now
					state.sortedContacts.push(sortedContact)
				}
			}

			// sortedContact is empty, just push it
			if (state.sortedContacts.length === 0) {
				state.sortedContacts.push(sortedContact)
			}

			// default contacts list
			Vue.set(state.contacts, contact.key, contact)

		} else {
			console.error('Error while adding the following contact', contact)
		}
	},

	/**
	 * Update a contact
	 *
	 * @param {Object} state the store data
	 * @param {Contact} contact the contact to update
	 */
	updateContact(state, contact) {
		if (state.contacts[contact.key] && contact instanceof Contact) {

			// replace contact object data
			state.contacts[contact.key].updateContact(contact.jCal)
			const sortedContact = state.sortedContacts.find(search => search.key === contact.key)

			// has the sort key changed for this contact ?
			const hasChanged = sortedContact.value !== contact[state.orderKey]
			if (hasChanged) {
				// then update the new data
				sortedContact.value = contact[state.orderKey]
				// and then we sort again
				state.sortedContacts.sort(sortData)
			}

		} else {
			console.error('Error while replacing the following contact', contact)
		}
	},

	/**
	 * Update a contact addressbook
	 *
	 * @param {Object} state the store data
	 * @param {Object} data destructuring object
	 * @param {Contact} contact the contact to update
	 * @param {Object} addressbook the addressbook to set
	 */
	updateContactAddressbook(state, { contact, addressbook }) {
		if (state.contacts[contact.key] && contact instanceof Contact) {
			// replace contact object data by creating a new contact
			const oldKey = contact.key

			// hijack reference
			const newContact = contact

			// delete old key, cut reference
			Vue.delete(state.contacts, oldKey)

			// replace addressbook
			Vue.set(newContact, 'addressbook', addressbook)

			// set new key, re-assign reference
			Vue.set(state.contacts, newContact.key, newContact)

			// Update sorted contacts list, replace at exact same position
			const index = state.sortedContacts.findIndex(search => search.key === oldKey)
			state.sortedContacts[index] = {
				key: newContact.key,
				value: newContact[state.orderKey],
			}
		} else {
			console.error('Error while replacing the addressbook of following contact', contact)
		}
	},

	/**
	 * Update a contact etag
	 *
	 * @param {Object} state the store data
	 * @param {Object} data destructuring object
	 * @param {Contact} contact the contact to update
	 * @param {string} etag the contact etag
	 */
	updateContactEtag(state, { contact, etag }) {
		if (state.contacts[contact.key] && contact instanceof Contact) {
			// replace contact object data
			state.contacts[contact.key].dav.etag = etag

		} else {
			console.error('Error while replacing the etag of following contact', contact)
		}
	},

	/**
	 * Order the contacts list. Filters have terrible performances.
	 * We do not want to run the sorting function every time.
	 * Let's only run it on additions and create an index
	 *
	 * @param {Object} state the store data
	 */
	sortContacts(state) {
		state.sortedContacts = Object.values(state.contacts)
			// exclude groups
			.filter(contact => contact.kind !== 'group')
			.map(contact => { return { key: contact.key, value: contact[state.orderKey] } })
			.sort(sortData)
	},

	/**
	 * Set the order key
	 *
	 * @param {Object} state the store data
	 * @param {string} [orderKey='displayName'] the order key to sort by
	 */
	setOrder(state, orderKey = 'displayName') {
		state.orderKey = orderKey
	},

	/**
	 * Set a contact as `in conflict` with the server data
	 *
	 * @param {Object} state the store data
	 * @param {Object} data destructuring object
	 * @param {Contact} data.contact the contact to update
	 * @param {String} data.etag the etag to set
	 */
	setContactAsConflict(state, { contact, etag }) {
		if (state.contacts[contact.key] && contact instanceof Contact) {
			state.contacts[contact.key].conflict = etag
		} else {
			console.error('Error while handling the following contact', contact)
		}
	},

	/**
	 * Set a contact dav property
	 *
	 * @param {Object} state the store data
	 * @param {Object} data destructuring object
	 * @param {Contact} data.contact the contact to update
	 * @param {Object} data.dav the dav object returned by the cdav library
	 */
	setContactDav(state, { contact, dav }) {
		if (state.contacts[contact.key] && contact instanceof Contact) {
			contact = state.contacts[contact.key]
			Vue.set(contact, 'dav', dav)
		} else {
			console.error('Error while handling the following contact', contact)
		}
	},
}

const getters = {
	getContacts: state => state.contacts,
	getSortedContacts: state => state.sortedContacts,
	getContact: (state) => (key) => state.contacts[key],
	getOrderKey: state => state.orderKey,
}

const actions = {

	/**
	 * Delete a contact from the list and from the associated addressbook
	 *
	 * @param {Object} context the store mutations
	 * @param {Object} data destructuring object
	 * @param {Contact} data.contact the contact to delete
	 * @param {boolean} [data.dav=true] trigger a dav deletion
	 */
	async deleteContact(context, { contact, dav = true }) {
		// only local delete if the contact doesn't exists on the server
		if (contact.dav && dav) {
			await contact.dav.delete()
				.catch((error) => {
					console.error(error)
					OC.Notification.showTemporary(t('contacts', 'An error occurred'))
				})
		}
		context.commit('deleteContact', contact)
		context.commit('deleteContactFromAddressbook', contact)
		context.commit('removeContactFromGroups', contact)
	},

	/**
	 * Add a contact to the list, the associated addressbook and to the groups
	 *
	 * @param {Object} context the store mutations
	 * @param {Contact} contact the contact to delete
	 */
	async addContact(context, contact) {
		await context.commit('addContact', contact)
		await context.commit('addContactToAddressbook', contact)
		await context.commit('extractGroupsFromContacts', [contact])
	},

	/**
	 * Replace a contact by this new object
	 *
	 * @param {Object} context the store mutations
	 * @param {Contact} contact the contact to update
	 * @returns {Promise}
	 */
	async updateContact(context, contact) {

		// Checking contact validity 🙈
		validate(contact)

		// Update REV
		const rev = new ICAL.VCardTime()
		rev.fromUnixTime(Date.now() / 1000)
		contact.rev = rev

		const vData = contact.vCard.toString()

		// if no dav key, contact does not exists on server
		if (!contact.dav) {
			// create contact
			const dav = await contact.addressbook.dav.createVCard(vData)
			context.commit('setContactDav', { contact, dav })
			return
		}

		// if contact already exists
		if (!contact.conflict) {
			contact.dav.data = vData
			try {
				await contact.dav.update()
				// all clear, let's update the store
				context.commit('updateContact', contact)
			} catch (error) {
				console.error(error)

				// wrong etag, we most likely have a conflict
				if (error && error.status === 412) {
					// saving the new etag so that the user can manually
					// trigger a fetchCompleteData without any further errors
					context.commit('setContactAsConflict', { contact, etag: error.xhr.getResponseHeader('etag') })
					console.error('This contact is outdated, the server refused it', contact)
				}
			}
		} else {
			console.error('This contact is outdated, refusing to push', contact)
		}
	},

	/**
	 * Fetch the full vCard from the dav server
	 *
	 * @param {Object} context the store mutations
	 * @param {Object} data destructuring object
	 * @param {Contact} data.contact the contact to fetch
	 * @param {string} data.etag the contact etag to override in case of conflict
	 * @returns {Promise}
	 */
	async fetchFullContact(context, { contact, etag = '' }) {
		if (etag.trim() !== '') {
			await context.commit('updateContactEtag', { contact, etag })
		}
		return contact.dav.fetchCompleteData()
			.then((response) => {
				const newContact = new Contact(contact.dav.data, contact.addressbook)
				context.commit('updateContact', newContact)
			})
			.catch((error) => { throw error })
	},
}

export default { state, mutations, getters, actions }
