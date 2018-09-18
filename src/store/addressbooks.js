/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
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

// import client from '../services/cdav'

const addressbookModel = {
	id: '',
	displayName: '',
	enabled: true,
	owner: '',
	shares: [],
	contacts: {},
	url: '',
	readOnly: false
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
	 * Delete addressbook
	 *
	 * @param {Object} state Default state
	 * @param {Object} addressbooks Addressbook
	 */
	deleteAddressbook(state, addressbook) {
		state.addressbooks.splice(state.addressbooks.indexOf(addressbook), 1)
	},

	/**
	 * Toggle whether a Addressbook is Enabled
	 * @param {Object} context Current context
	 * @param {Object} addressbook
	 */
	toggleAddressbookEnabled(context, addressbook) {
		addressbook = state.addressbooks.find(search => search.id === addressbook.id)
		addressbook.enabled = !addressbook.enabled
	},

	/**
	 * Rename a Addressbook
	 * @param {Object} context Current context
	 * @param {Object} data.addressbook
	 * @param {String} data.newName
	 */
	renameAddressbook(context, { addressbook, newName }) {
		addressbook = state.addressbooks.find(search => search.id === addressbook.id)
		addressbook.displayName = newName
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
		let addressbook = state.addressbooks.find(search => search.id === contact.addressbook.id)
		Vue.set(addressbook.contacts, contact.uid, contact)
	},

	/**
	 * Delete a contact in a specified addressbook
	 *
	 * @param {Object} state
	 * @param {Contact} contact the contact to delete
	 */
	deleteContactFromAddressbook(state, contact) {
		let addressbook = state.addressbooks.find(search => search.id === contact.addressbook.id)
		Vue.delete(addressbook, contact.uid)
	},

	/**
	 * Share addressbook with a user or group
	 *
	 * @param {Object} state
	 * @param {Object} data
	 * @param {Object} data.addressbook the addressbook
	 * @param {String} data.sharee the sharee
	 * @param {Boolean} data.id id
	 * @param {Boolean} data.group group
	 */
	shareAddressbook(state, { addressbook, sharee, id, group }) {
		addressbook = state.addressbooks.find(search => search.id === addressbook.id)
		let newSharee = {
			displayname: sharee,
			id,
			writeable: false,
			group
		}
		addressbook.shares.push(newSharee)
	},

	/**
	 * Remove Sharee from addressbook shares list
	 *
	 * @param {Object} state
	 * @param {Object} sharee the sharee
	 */
	removeSharee(state, sharee) {
		let addressbook = state.addressbooks.find(search => {
			for (let i in search.shares) {
				if (search.shares[i] === sharee) {
					return true
				}
			}
		})
		addressbook.shares.splice(addressbook.shares.indexOf(sharee), 1)
	},

	/**
	 * Toggle sharee's writable permission
	 *
	 * @param {Object} state
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
		// let addressbooks = client.addressbookHomes.map(addressbook => {
		let addressbooks = [{
			id: 'ab1',
			displayName: 'Addressbook 1',
			enabled: true,
			owner: 'admin',
			url: '/remote.php/dav/ab1',
			// dav: addressbook
			readOnly: false
		}, {
			id: 'ab2',
			displayName: 'Addressbook 2',
			enabled: true,
			owner: 'admin',
			url: '/remote.php/dav/ab2',
			// dav: addressbook
			readOnly: true
		}]
		// })

		addressbooks.forEach(addressbook => {
			context.commit('addAddressbooks', addressbook)
		})

		return addressbooks
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
	 * Delete Addressbook
	 * @param {Object} context Current context
	 * @param {Object} addressbook
	 */
	deleteAddressbook(context, addressbook) {
		context.commit('deleteAddressbook', addressbook)
	},

	/**
	 * Toggle whether a Addressbook is Enabled
	 * @param {Object} context Current context
	 * @param {Object} addressbook
	 */
	toggleAddressbookEnabled(context, addressbook) {
		context.commit('toggleAddressbookEnabled', addressbook)
	},

	/**
	 * Rename a Addressbook
	 * @param {Object} context Current context
	 * @param {Object} data.addressbook
	 * @param {String} data.newName
	 */
	renameAddressbook(context, { addressbook, newName }) {
		context.commit('renameAddressbook', { addressbook, newName })
	},

	/**
	 * Retrieve the contacts of the specified addressbook
	 * and commit the results
	 *
	 * @param {Object} context
	 * @param {Object} importDetails = { vcf, addressbook }
	 */
	getContactsFromAddressBook(context, { addressbook }) {
		let contacts = parseVcf(vcfFile, addressbook)
		context.commit('appendContactsToAddressbook', { addressbook, contacts })
		context.commit('appendContacts', contacts)
		context.commit('sortContacts')
		context.commit('appendGroupsFromContacts', contacts)
	},

	/**
	 *
	 * @param {Object} context
	 * @param {Object} importDetails = { vcf, addressbook }
	 */
	importContactsIntoAddressbook(context, { vcf, addressbook }) {
		let contacts = parseVcf(vcf, addressbook)
		context.commit('changeStage', 'importing')
		contacts.forEach(contact => {
			context.commit('addContact', contact)
			context.commit('addContactToAddressbook', contact)
			context.commit('appendGroupsFromContacts', [contact])
		})
		context.commit('changeStage', 'default')
	},

	/**
	 * Remove sharee from Addressbook
	 * @param {Object} context Current context
	 * @param {Object} sharee Addressbook sharee object
	 */
	removeSharee(context, sharee) {
		context.commit('removeSharee', sharee)
	},

	/**
	 * Toggle permissions of Addressbook Sharees writeable rights
	 * @param {Object} context Current context
	 * @param {Object} sharee Addressbook sharee object
	 */
	toggleShareeWritable(context, sharee) {
		context.commit('updateShareeWritable', sharee)
	},

	/**
	 * Share Adressbook with User or Group
	 * @param {Object} context Current context
	 * @param {Object} data.addressbook the addressbook
	 * @param {String} data.sharee the sharee
	 * @param {Boolean} data.id id
	 * @param {Boolean} data.group group
	 */
	shareAddressbook(context, { addressbook, sharee, id, group }) {
		// Share addressbook with entered group or user
		context.commit('shareAddressbook', { addressbook, sharee, id, group })
	},

	/**
	 * Move a contact to the provided addressbook
	 *
	 * @param {Object} context
	 * @param {Object} data
	 * @param {Contact} data.contact
	 * @param {Object} data.addressbook
	 */
	moveContactToAddressbook(context, { contact, addressbook }) {
		context.commit('deleteContactFromAddressbook', contact)
		context.commit('updateContactAddressbook', { contact, addressbook })
		context.commit('addContactToAddressbook', contact)
	}
}

export default { state, mutations, getters, actions }
