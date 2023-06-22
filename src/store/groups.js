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
	removeContactToGroup(state, { groupName, contact }) {
		const contacts = state.groups.find(search => search.name === groupName).contacts
		const index = contacts.findIndex(search => search === contact.key)
		if (index > -1) {
			contacts.splice(index, 1)
		}
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
	removeContactToGroup(context, { groupName, contact }) {
		context.commit('removeContactToGroup', { groupName, contact })
	},

	/**
	 * Add a group
	 *
	 * @param {object} context the store mutations
	 * @param {string} groupName the name of the group
	 */
	addGroup(context, groupName) {
		context.commit('addGroup', groupName)
	},
}

export default { state, mutations, getters, actions }
