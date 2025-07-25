/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { showError } from '@nextcloud/dialogs'
import pLimit from 'p-limit'

import Contact, { MinimalContactProperties } from '../models/contact.js'

import client from '../services/cdav.js'
import parseVcf from '../services/parseVcf.js'

const addressbookModel = {
	id: '',
	displayName: '',
	enabled: true,
	owner: '',
	shares: [],
	contacts: {},
	url: '',
	readOnly: false,
	dav: false,
}

const state = {
	addressbooks: [],
}

/**
 * map a dav collection to our addressbook object model
 *
 * @param {object} addressbook the addressbook object from the cdav library
 * @return {object}
 */
export function mapDavCollectionToAddressbook(addressbook) {
	return {
		// get last part of url
		id: addressbook.url.split('/').slice(-2, -1)[0],
		displayName: addressbook.displayname,
		enabled: addressbook.enabled !== false,
		owner: addressbook.owner,
		readOnly: addressbook.readOnly === true,
		writeProps: addressbook.currentUserPrivilegeSet.includes('{DAV:}write-properties') === true,
		url: addressbook.url,
		dav: addressbook,
		shares: addressbook.shares
			? addressbook.shares.map(sharee => Object.assign({}, mapDavShareeToSharee(sharee)))
			: [],
	}
}

/**
 * map a dav collection to our addressbook object model
 *
 * @param {object} sharee the sharee object from the cdav library shares
 * @return {object}
 */
export function mapDavShareeToSharee(sharee) {
	const id = sharee.href.split('/').slice(-1)[0]
	const name = sharee['common-name']
		? sharee['common-name']
		: id
	return {
		displayName: name,
		id,
		writeable: sharee.access[0].endsWith('read-write'),
		isGroup: sharee.href.startsWith('principal:principals/groups/'),
		uri: sharee.href,
	}
}

const mutations = {

	/**
	 * Add addressbook into state
	 *
	 * @param {object} state the store data
	 * @param {object} addressbook the addressbook to add
	 */
	addAddressbook(state, addressbook) {
		// extend the addressbook to the default model
		const newAddressbook = Object.assign({}, addressbookModel, addressbook)
		// force reinit of the contacts object to prevent
		// data passed as references
		newAddressbook.contacts = {}
		state.addressbooks.push(newAddressbook)
	},

	/**
	 * Delete addressbook
	 *
	 * @param {object} state the store data
	 * @param {object} addressbook the addressbook to delete
	 */
	deleteAddressbook(state, addressbook) {
		state.addressbooks.splice(state.addressbooks.indexOf(addressbook), 1)
	},

	/**
	 * Toggle whether a Addressbook is Enabled
	 *
	 * @param {object} context the store mutations
	 * @param {object} addressbook the addressbook to toggle
	 */
	toggleAddressbookEnabled(context, addressbook) {
		addressbook = state.addressbooks.find(search => search.id === addressbook.id)
		addressbook.enabled = !addressbook.enabled
	},

	/**
	 * Rename a Addressbook
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook to rename
	 * @param {string} data.newName the new name of the addressbook
	 */
	renameAddressbook(context, { addressbook, newName }) {
		addressbook = state.addressbooks.find(search => search.id === addressbook.id)
		addressbook.displayName = newName
	},

	/**
	 * Append a list of contacts to an addressbook
	 * and remove duplicates
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook to add the contacts to
	 * @param {Contact[]} data.contacts array of contacts to append
	 */
	appendContactsToAddressbook(state, { addressbook, contacts }) {
		addressbook = state.addressbooks.find(search => search.id === addressbook.id)

		// convert list into an array and remove duplicate
		addressbook.contacts = contacts.reduce((list, contact) => {
			if (list[contact.uid]) {
				console.info('Duplicate contact overrided', list[contact.uid], contact)
			}
			list[contact.uid] = contact
			return list
		}, addressbook.contacts)
	},

	/**
	 * Add a contact to an addressbook and overwrite if duplicate uid
	 *
	 * @param {object} state the store data
	 * @param {Contact} contact the contact to add
	 */
	addContactToAddressbook(state, contact) {
		const addressbook = state.addressbooks.find(search => search.id === contact.addressbook.id)
		addressbook.contacts[contact.uid] = contact
	},

	/**
	 * Delete a contact in a specified addressbook
	 *
	 * @param {object} state the store data
	 * @param {Contact} contact the contact to delete
	 */
	deleteContactFromAddressbook(state, contact) {
		const addressbook = state.addressbooks.find(search => search.id === contact.addressbook.id)
		delete addressbook.contacts[contact.uid]
	},

	/**
	 * Share addressbook with a user or group
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.user the userId
	 * @param {string} data.displayName the displayName
	 * @param {string} data.uri the sharing principalScheme uri
	 * @param {boolean} data.isGroup is this a group ?
	 */
	shareAddressbook(state, { addressbook, user, displayName, uri, isGroup }) {
		addressbook = state.addressbooks.find(search => search.id === addressbook.id)
		const newSharee = {
			displayName,
			id: user,
			writeable: false,
			isGroup,
			uri,
		}
		if (!addressbook.shares.some((share) => share.uri === uri)) {
			addressbook.shares.push(newSharee)
		}
	},

	/**
	 * Remove Sharee from addressbook shares list
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.uri the sharee uri
	 */
	removeSharee(state, { addressbook, uri }) {
		addressbook = state.addressbooks.find(search => search.id === addressbook.id)
		const shareIndex = addressbook.shares.findIndex(sharee => sharee.uri === uri)
		addressbook.shares.splice(shareIndex, 1)
	},

	/**
	 * Toggle sharee's writable permission
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.uri the sharee uri
	 */
	updateShareeWritable(state, { addressbook, uri }) {
		addressbook = state.addressbooks.find(search => search.id === addressbook.id)
		const sharee = addressbook.shares.find(sharee => sharee.uri === uri)
		sharee.writeable = !sharee.writeable
	},

}

const getters = {
	getAddressbooks: state => state.addressbooks,
}

const actions = {

	/**
	 * Retrieve and commit addressbooks
	 *
	 * @param {object} context the store mutations
	 * @return {object[]} the addressbooks
	 */
	async getAddressbooks(context) {
		const addressbooks = await client.addressBookHomes[0]
			.findAllAddressBooks()
			.then(addressbooks => {
				return addressbooks.map(addressbook => {
					// formatting addressbooks
					return mapDavCollectionToAddressbook(addressbook)
				})
			})

		addressbooks.forEach(addressbook => {
			context.commit('addAddressbook', addressbook)
		})

		return addressbooks
	},

	/**
	 * Append a new address book to array of existing address books
	 *
	 * @param {object} context the store mutations
	 * @param {object} addressbook The address book to append
	 * @return {Promise}
	 */
	async appendAddressbook(context, addressbook) {
		return client.addressBookHomes[0]
			.createAddressBookCollection(addressbook.displayName)
			.then((response) => {
				addressbook = mapDavCollectionToAddressbook(response)
				context.commit('addAddressbook', addressbook)
			})
			.catch((error) => { throw error })
	},

	/**
	 * Delete Addressbook
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} addressbook the addressbool to delete
	 * @return {Promise}
	 */
	async deleteAddressbook(context, addressbook) {
		return addressbook.dav
			.delete()
			.then((response) => {
				// delete all the contacts from the store that belong to this addressbook
				Object.values(addressbook.contacts)
					.forEach(contact => context.commit('deleteContact', contact))
				// then delete the addressbook
				context.commit('deleteAddressbook', addressbook)
			})
			.catch((error) => { throw error })
	},

	/**
	 * Toggle whether a Addressbook is Enabled
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} addressbook the addressbook to toggle
	 * @return {Promise}
	 */
	async toggleAddressbookEnabled(context, addressbook) {
		addressbook.dav.enabled = !addressbook.enabled
		return addressbook.dav
			.update()
			.then(async (response) => {
				context.commit('toggleAddressbookEnabled', addressbook)
				if (addressbook.enabled) {
					const contacts = Object.values(addressbook.contacts)

					// If the address book is disabled on first load, the store does not fetch/store the AB's contacts
					if (contacts.length === 0) {
						await context.dispatch('getContactsFromAddressBook', { addressbook })
					}

					// Add contacts from the just enabled address book to the contacts store
					Object.values(addressbook.contacts).forEach((contact) => {
						context.commit('addContact', contact)
					})
				} else {
					// Remove contacts from the just disabled address book from the contacts store
					Object.values(addressbook.contacts).forEach((contact) => {
						context.commit('deleteContact', contact)
					})
				}
			})
			.catch((error) => { throw error })
	},

	/**
	 * Rename a Addressbook
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} data.addressbook the addressbook to rename
	 * @param {string} data.newName the new name of the addressbook
	 * @param data.addressbook.addressbook
	 * @param data.addressbook.newName
	 * @return {Promise}
	 */
	async renameAddressbook(context, { addressbook, newName }) {
		addressbook.dav.displayname = newName
		return addressbook.dav
			.update()
			.then((response) => context.commit('renameAddressbook', { addressbook, newName }))
			.catch((error) => { throw error })
	},

	/**
	 * Retrieve the contacts of the specified addressbook
	 * and commit the results
	 *
	 * @param {object} context the store mutations
	 * @param {object} importDetails = { vcf, addressbook }
	 * @param importDetails.addressbook
	 * @return {Promise}
	 */
	async getContactsFromAddressBook(context, { addressbook }) {
		return addressbook.dav
			.findAllAndFilterBySimpleProperties(MinimalContactProperties)
			.then((response) => {
				// We don't want to lose the url information
				// so we need to parse one by one
				let failed = 0
				const contacts = response
					.reduce((contacts, item) => {
						try {
							const contact = new Contact(item.data, addressbook)
							contact.dav = item
							contacts.push(contact)
						} catch (error) {
							// PARSING FAILED
							console.error('Error reading contact', item.url, item.data)
							console.error(error)
							failed++
						}
						return contacts
					}, [])

				if (failed > 0) {
					showError(n(
						'contacts',
						'{failed} contact failed to be read',
						'{failed} contacts failed to be read',
						failed,
						{ failed },
					))
				}

				context.commit('appendContactsToAddressbook', { addressbook, contacts })
				context.commit('extractGroupsFromContacts', contacts)

				// don't add contacts from disabled address book to contacts store
				if (addressbook.enabled) {
					context.commit('appendContacts', contacts)
					context.commit('sortContacts')
				}
				return contacts
			})
			.catch((error) => {
				// unrecoverable error, if no contacts were loaded,
				// remove the addressbook
				// TODO: create a failed addressbook state and show that there was an issue?
				context.commit('deleteAddressbook', addressbook)
				console.error(error)
			})
	},

	/**
	 *
	 * @param {object} context the store mutations
	 * @param {object} importDetails = { vcf, addressbook }
	 * @param importDetails.vcf
	 * @param importDetails.addressbook
	 */
	async importContactsIntoAddressbook(context, { vcf, addressbook }) {
		const contacts = parseVcf(vcf, addressbook)
		context.commit('changeStage', 'importing')

		// max simultaneous requests
		const limit = pLimit(3)
		const requests = []

		// create the array of requests to send
		contacts.map(async contact => {
			console.info(contact)

			// Get vcard string
			try {
				const vData = contact.toStringStripQuotes()
				// push contact to server and use limit
				requests.push(limit(() => contact.addressbook.dav.createVCard(vData)
					.then((response) => {
						// setting the contact dav property
						contact.dav = response

						// success, update store
						context.commit('addContact', contact)
						context.commit('addContactToAddressbook', contact)
						context.commit('extractGroupsFromContacts', [contact])
						context.commit('incrementAccepted')
					})
					.catch((error) => {
						// error
						context.commit('incrementDenied')
						console.error(error)
					}),
				))
			} catch (e) {
				context.commit('incrementDenied')
			}
		})

		Promise.all(requests).then(() => {
			context.commit('changeStage', 'done')
		})
	},

	/**
	 * Remove sharee from Addressbook
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.uri the sharee uri
	 */
	async removeSharee(context, { addressbook, uri }) {
		try {
			await addressbook.dav.unshare(uri)
			context.commit('removeSharee', { addressbook, uri })
		} catch (error) {
			console.error(error)
			throw error
		}
	},

	/**
	 * Toggle permissions of Addressbook Sharees writeable rights
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} data destructuring object
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.uri the sharee uri
	 * @param {boolean} data.writeable the sharee permission
	 */
	async toggleShareeWritable(context, { addressbook, uri, writeable }) {
		try {
			await addressbook.dav.share(uri, writeable)
			context.commit('updateShareeWritable', { addressbook, uri, writeable })
		} catch (error) {
			console.error(error)
			throw error
		}

	},

	/**
	 * Share Adressbook with User or Group
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} data.addressbook the addressbook
	 * @param {string} data.user the userId
	 * @param {string} data.displayName the displayName
	 * @param {string} data.uri the sharing principalScheme uri
	 * @param {boolean} data.isGroup is this a group ?
	 * @param data.addressbook.addressbook
	 * @param data.addressbook.user
	 * @param data.addressbook.displayName
	 * @param data.addressbook.uri
	 * @param data.addressbook.isGroup
	 */
	async shareAddressbook(context, { addressbook, user, displayName, uri, isGroup }) {
		// Share addressbook with entered group or user
		try {
			await addressbook.dav.share(uri)
			context.commit('shareAddressbook', { addressbook, user, displayName, uri, isGroup })
		} catch (error) {
			console.error(error)
			throw error
		}
	},

	/**
	 * Move a contact to the provided addressbook
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {Contact} data.contact the contact to move
	 * @param {object} data.addressbook the addressbook to move the contact to
	 * @return {Contact} the new contact object
	 */
	async moveContactToAddressbook(context, { contact, addressbook }) {
		// only local move if the contact doesn't exists on the server
		if (contact.dav) {
			try {
				await contact.dav.move(addressbook.dav)
			} catch (error) {
				console.error(error)
				throw error
			}
		}
		const groups = contact.groups
		await context.commit('deleteContactFromAddressbook', contact)
		await context.commit('removeContactFromGroups', contact)
		await context.commit('updateContactAddressbook', { contact, addressbook })
		await context.commit('addContactToAddressbook', contact)
		await context.commit('addContactToGroups', { contact, groupNames: groups })
		return contact
	},

	/**
	 * Copy a contact to the provided addressbook
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {Contact} data.contact the contact to copy
	 * @param {object} data.addressbook the addressbook to move the contact to
	 * @return {Contact} the new contact object
	 */
	async copyContactToAddressbook(context, { contact, addressbook }) {
		// init new contact & strip old uid
		const vData = contact.vCard.toString().replace(/^UID.+/im, '')
		const newContact = new Contact(vData, addressbook)

		try {
			const response = await contact.dav.copy(addressbook.dav)
			// setting the contact dav property
			newContact.dav = response
		} catch (error) {
			console.error(error)
			throw error
		}
		// success, update store
		await context.commit('addContact', newContact)
		await context.commit('addContactToAddressbook', newContact)
		return newContact
	},
}

export default { state, mutations, getters, actions }
