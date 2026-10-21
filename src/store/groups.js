/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Contact from '../models/contact.js'
import { isContactsPagingEnabled } from '../services/contactsPaging.js'
import logger from '../services/logger.js'

const state = {
	groups: [],
	// whether a contact of the address book has a line manager, by address book id
	addressbooksWithManagers: {},
}

/**
 * Find a group by name, create it if missing
 *
 * @param {object} state the store data
 * @param {string} groupName the name of the group
 * @return {object}
 */
function findOrCreateGroup(state, groupName) {
	let group = state.groups.find((search) => search.name === groupName)
	if (!group) {
		state.groups.push({
			name: groupName,
			contacts: [],
		})
		group = state.groups.find((search) => search.name === groupName)
	}
	return group
}

const mutations = {
	/**
	 * Extract all the groups from the provided contacts
	 * and add the contacts to their respective groups,
	 * skipping contacts that are already members
	 *
	 * @param {object} state the store data
	 * @param {Contact[]} contacts the contacts to add
	 */
	extractGroupsFromContacts(state, contacts) {
		const membersByGroup = new Map()
		contacts.forEach((contact) => {
			if (contact.groups) {
				contact.groups.forEach((groupName) => {
					const group = findOrCreateGroup(state, groupName)
					if (!membersByGroup.has(groupName)) {
						membersByGroup.set(groupName, new Set(group.contacts))
					}
					const members = membersByGroup.get(groupName)
					if (!members.has(contact.key)) {
						members.add(contact.key)
						group.contacts.push(contact.key)
					}
				})
			}
		})
	},

	/**
	 * Add contact keys to groups, creating missing groups
	 * and skipping keys that are already members
	 *
	 * @param {object} state the store data
	 * @param {Array<{name: string, contacts: string[]}>} groups the group members
	 */
	mergeGroupMembers(state, groups) {
		groups.forEach(({ name, contacts }) => {
			const group = findOrCreateGroup(state, name)
			const members = new Set(group.contacts)
			const newMembers = contacts.filter((key) => !members.has(key))
			if (newMembers.length > 0) {
				group.contacts = group.contacts.concat(newMembers)
			}
		})
	},

	/**
	 * Add contact to group and create group if not existing
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {Array<string>} data.groupNames the names of the group
	 * @param {Contact} data.contact the contact
	 */
	addContactToGroups(state, { groupNames, contact }) {
		groupNames.forEach((groupName) => {
			let group = state.groups.find((search) => search.name === groupName)
			// nothing? create a new one
			if (!group) {
				state.groups.push({
					name: groupName,
					contacts: [],
				})
				group = state.groups.find((search) => search.name === groupName)
			}
			group.contacts.push(contact.key)
		})
	},

	/**
	 * Remove contact from group
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {string} data.groupName the name of the group
	 * @param {Contact} data.contact the contact
	 */
	removeContactFromGroup(state, { groupName, contact }) {
		if (!state.groups.find((search) => search.name === groupName)) {
			return
		}

		const contacts = state.groups.find((search) => search.name === groupName).contacts
		const index = contacts.findIndex((search) => search === contact.key)
		if (index > -1) {
			contacts.splice(index, 1)
		}
	},

	/**
	 * Rename contact from group
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {string} data.oldGroupName name that gets removed
	 * @param {string} data.newGroupName name that gets added
	 */
	renameGroup(state, { oldGroupName, newGroupName }) {
		state.groups.forEach((group) => {
			if (group.name === oldGroupName) {
				group.name = newGroupName
			}
		})
	},

	/**
	 * Remove contact from its groups
	 *
	 * @param {object} state the store data
	 * @param {Contact} contact the contact
	 */
	removeContactFromGroups(state, contact) {
		state.groups.forEach((group) => {
			const index = group.contacts.indexOf(contact.key)
			if (index !== -1) {
				group.contacts.splice(index, 1)
			}
		})
	},

	/**
	 * Add a group
	 *
	 * @param {object} state the store data
	 * @param {string} groupName the name of the group
	 */
	addGroup(state, groupName) {
		state.groups.push({
			name: groupName,
			contacts: [],
		})
	},

	/**
	 * Remove a group
	 *
	 * @param {object} state the store data
	 * @param {string} groupName the name of the group
	 */
	removeGroup(state, groupName) {
		state.groups = state.groups.filter((group) => group.name !== groupName)
	},

	/**
	 * Set whether a contact of the address book has a line manager
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {string} data.addressbookId the id of the address book
	 * @param {boolean} data.hasManagers whether a contact has a line manager
	 */
	setAddressbookHasManagers(state, { addressbookId, hasManagers }) {
		state.addressbooksWithManagers = { ...state.addressbooksWithManagers, [addressbookId]: hasManagers }
	},
}

const getters = {
	getGroups: (state) => state.groups,
	getAddressbooksWithManagers: (state) => state.addressbooksWithManagers,
}

const actions = {

	updateContactGroups(context, { groupNames, contact }) {
		context.commit('removeContactFromGroups', contact)
		context.commit('addContactToGroups', { groupNames, contact })
	},
	/**
	 * Add contact and to a group
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {string} data.groupName the name of the group
	 * @param {Contact} data.contact the contact
	 */
	addContactToGroup(context, { groupName, contact }) {
		context.commit('addContactToGroups', { groupNames: [groupName], contact })
	},

	/**
	 * Add contact to multiple groups
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {string} data.groupNames group names
	 * @param {Contact} data.contact the contact
	 */
	addContactToGroups(context, { groupNames, contact }) {
		context.commit('addContactToGroups', { groupNames, contact })
	},

	/**
	 * Remove contact from its groups
	 *
	 * @param {object} context the store mutations
	 * @param {Contact} contact the contact
	 */
	removeContactFromGroups(context, contact) {
		context.commit('removeContactFromGroups', contact)
	},

	/**
	 * Remove contact from group
	 *
	 * @param {object} context the store mutations
	 * @param {object} data destructuring object
	 * @param {string} data.groupName the name of the group
	 * @param {Contact} data.contact the contact
	 */
	removeContactFromGroup(context, { groupName, contact }) {
		context.commit('removeContactFromGroup', { groupName, contact })
	},

	/**
	 * Add a group
	 *
	 * @param {object} context the store mutations
	 * @param {string} groupName the name of the group
	 */
	addGroup(context, groupName) {
		if (!groupName || groupName.trim() === '') {
			throw new Error('Group name cannot be empty')
		}
		context.commit('addGroup', groupName)
	},

	/**
	 * Load the members of every group of the enabled address books, and whether they contain
	 * contacts with a line manager, without loading the contacts themselves, when address books
	 * are loaded page by page and loaded contacts don't cover the whole address books
	 *
	 * @param {object} context the store mutations
	 * @param {object} [data] destructuring object
	 * @param {object[]} [data.addressbooks] the address books to read, all address books by default
	 * @return {Promise<void>}
	 */
	async fetchGroupMembers(context, { addressbooks } = {}) {
		if (!isContactsPagingEnabled()) {
			return
		}

		const members = new Map()
		await Promise.all((addressbooks ?? context.rootGetters.getAddressbooks)
			.filter((addressbook) => addressbook.enabled)
			.map(async (addressbook) => {
				let vcards
				try {
					vcards = await addressbook.dav.findAllAndFilterBySimpleProperties(['UID', 'CATEGORIES', 'X-MANAGERSNAME'])
				} catch (error) {
					logger.error('Unable to load the groups of the address book', { addressbook: addressbook.id, error })
					return
				}

				let hasManagers = false
				vcards.forEach((vcard) => {
					try {
						const contact = new Contact(vcard.data, addressbook)
						if (contact.managersName) {
							hasManagers = true
						}
						contact.groups.forEach((groupName) => {
							if (!members.has(groupName)) {
								members.set(groupName, [])
							}
							members.get(groupName).push(contact.key)
						})
					} catch (error) {
						logger.error('Error reading contact', { url: vcard.url, error })
					}
				})
				context.commit('setAddressbookHasManagers', { addressbookId: addressbook.id, hasManagers })
			}))

		context.commit('mergeGroupMembers', [...members].map(([name, contacts]) => ({ name, contacts })))
	},
}

export default { state, mutations, getters, actions }
