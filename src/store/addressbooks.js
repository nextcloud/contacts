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

/* eslint-disable-next-line import/no-webpack-loader-syntax */
import vcfFile from '!raw-loader!./FakeName.vcf'
import parseVcf from '../services/parseVcf'
import Vue from 'vue'

const addressbookModel = {
	id: '',
	displayName: '',
	enabled: true,
	owner: '',
	shares: [],
	contacts: {}
}

const state = {
	addressbooks: []
}

const mutations = {

	/**
	 * Add addressbook into state
	 *
	 * @param {Object} state Default state
	 * @param {Object} addressbooks Addressbook
	 */
	addAddressbooks(state, addressbook) {
		// extend the addressbook to the default model
		state.addressbooks.push(Object.assign({}, addressbookModel, addressbook))
	},

	/**
	 * Append a list of contacts to an addressbook
	 * and remove duplicates
	 *
	 * @param {Object} state
	 * @param {Object} data
	 * @param {Object} data.addressbook the addressbook
	 * @param {Contact[]} data.contacts array of contacts to append
	 */
	appendContactsToAddressbook(state, { addressbook, contacts }) {
		addressbook = state.addressbooks.find(search => search === addressbook)

		// convert list into an array and remove duplicate
		addressbook.contacts = contacts.reduce((list, contact) => {
			if (list[contact.uid]) {
				console.debug('Duplicate contact overrided', list[contact.uid], contact)
			}
			Vue.set(list, contact.uid, contact)
			return list
		}, addressbook.contacts)
	},

	/**
	 * Add a contact to an addressbook and overwrite if duplicate uid
	 *
	 * @param {Object} state
	 * @param {Contact} contact
	 */
	addContactToAddressbook(state, contact) {
		let addressbook = state.addressbooks.find(search => search === contact.addressbook)
		Vue.set(addressbook.contacts, contact.key, contact)
	},

	/**
	 * Delete a contact in a specified addressbook
	 *
	 * @param {Object} state
	 * @param {Contact} contact the contact to delete
	 */
	deleteContactFromAddressbook(state, contact) {
		let addressbook = state.addressbooks.find(addressbook => addressbook === contact.addressbook)
		Vue.delete(addressbook, contact.uid)
	},

	/**
	 * Share addressbook with a user or group
	 *
	 * @param {Object} state
	 * @param {Object} data
	 * @param {Object} data.addressbook the addressbook
	 */
	shareAddressbook(state, addressbook, sharee) {
		addressbook = state.addressbooks.find(search => search === addressbook)
		let newSharee = {}
		sharee.displayname = sharee
		sharee.writable = false
		addressbook.shares.append(newSharee)
	},

	/**
	 * Remove Share from addressbook shares list
	 *
	 * @param {Object} state
	 * @param {Object} data
	 * @param {Object} data.addressbook the addressbook
	 */
	removeSharee(state, sharee) {
		let addressbook = state.addressbooks.find(search => {
			for (let i in search.shares) {
				if (search.shares[i] === sharee) {
					return true
				}
			}
		})
		addressbook.shares.splice(sharee, 1)
	},

	/**
	 * Toggle sharee's writable permission
	 *
	 * @param {Object} state
	 * @param {Object} data
	 * @param {Object} data.addressbook the addressbook
	 * @param {Object} sharee the sharee
	 */
	updateShareeWritable(state, sharee) {
		let addressbook = state.addressbooks.find(search => {
			for (let i in search.shares) {
				if (search.shares[i] === sharee) {
					return true
				}
			}
		})
		sharee = addressbook.shares.find(search => search === sharee)
		sharee.writeable = !sharee.writeable
	}

}

const getters = {
	getAddressbooks: state => state.addressbooks
}

const actions = {

	/**
	 * Retrieve and commit addressbooks
	 *
	 * @param {Object} context
	 * @returns {Promise} fetch and commit
	 */
	async getAddressbooks(context) {
		// Fake data before using real dav requests
		let addressbooks = [
			{
				id: 'ab1',
				displayName: 'Addressbook 1',
				enabled: true,
				owner: 'admin',
				shares: [
					{ displayname: 'Bob', writeable: true },
					{ displayname: 'Rita', writeable: true },
					{ displayname: 'Sue', writeable: false }
				],
				contacts: {}
			},
			{
				id: 'ab2',
				displayName: 'Addressbook 2',
				enabled: false,
				owner: 'admin',
				shares: [
					{ displayname: 'Aimee', writeable: false },
					{ displayname: 'Jaguar', writeable: true }
				],
				contacts: {}
			},
			{
				id: 'ab3',
				displayName: 'Addressbook 3',
				enabled: true,
				owner: 'User1',
				shares: [],
				contacts: {}
			}
		]
		// fake request
		return new Promise((resolve, reject) => {
			return setTimeout(() => {
				addressbooks.forEach(addressbook => {
					context.commit('addAddressbooks', addressbook)
				})
				resolve()
				return addressbooks
			}, 1000)
		})
	},

	/**
	 * Append a new address book to array of existing address books
	 *
	 * @param {Object} context
	 * @param {Object} addressbook The address book to append
	 */
	appendAddressbook(context, addressbook) {
		context.commit('addAddressbooks', addressbook)
	},

	/**
	 * Retrieve the contacts of the specified addressbook
	 * and commit the results
	 *
	 * @param {Object} context
	 * @param {Object} addressbook
	 */
	async getContactsFromAddressBook(context, addressbook) {
		let contacts = parseVcf(vcfFile, addressbook)
		context.commit('appendContactsToAddressbook', { addressbook, contacts })
		context.commit('appendContacts', contacts)
		context.commit('sortContacts')
		context.commit('appendGroups', contacts)
	},

	/**
	 * Remove sharee from Addressbook
	 * @param {Object} context Current context
	 * @param {Object} sharee Addressbook sharee object
	 */
	removeSharee(context, sharee) {
		// Remove sharee from addressbook.
		context.commit('removeSharee', sharee)
	},

	/**
	 * Toggle permissions of Addressbook Sharees writeable rights
	 * @param {Object} context Current context
	 * @param {Object} sharee Addressbook sharee object
	 */
	toggleShareeWritable(context, sharee) {
		// Toggle sharee edit permissions.
		context.commit('updateShareeWritable', sharee)
	},

	/**
	 * Share Adressbook with User or Group
	 * @param {Object} context Current context
	 * @param {Object} addressbook Addressbook selected
	 * @param {Object} sharee Addressbook sharee object
	 */
	shareAddressbook(contect, addressbook, sharee) {
		// Share addressbook with entered group or user
	}
}

export default { state, mutations, getters, actions }
