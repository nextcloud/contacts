/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const state = {
	groups: [],
}

const mutations = {
	/**
	 * Extract all the groups from the provided contacts
	 * and add the contacts to their respective groups
	 *
	 * @param {object} state the store data
	 * @param {Contact[]} contacts the contacts to add
	 */
	extractGroupsFromContacts(state, contacts) {
		// iterate contacts
		contacts.forEach(contact => {
			if (contact.groups) {
				contact.groups.forEach(groupName => {
					let group = state.groups.find(search => search.name === groupName)
					// nothing? create a new one
					if (!group) {
						state.groups.push({
							name: groupName,
							contacts: [],
						})
						group = state.groups.find(search => search.name === groupName)
					}
					group.contacts.push(contact.key)
				})
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
		groupNames.forEach(groupName => {
			let group = state.groups.find(search => search.name === groupName)
			// nothing? create a new one
			if (!group) {
				state.groups.push({
					name: groupName,
					contacts: [],
				})
				group = state.groups.find(search => search.name === groupName)
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
		if (!state.groups.find(search => search.name === groupName)) {
			return
		}

		const contacts = state.groups.find(search => search.name === groupName).contacts
		const index = contacts.findIndex(search => search === contact.key)
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
		state.groups.forEach(group => {
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
		state.groups = state.groups.filter(group => group.name !== groupName)
	},
}

const getters = {
	getGroups: state => state.groups,
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
}

export default { state, mutations, getters, actions }
