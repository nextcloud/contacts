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
	groups: []
}

const mutations = {
	/**
	 * Extract all the groups from the provided contacts
	 * and add the contacts to their respective groups
	 *
	 * @param {Object} state the store data
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
							contacts: []
						})
						group = state.groups.find(search => search.name === groupName)
					}
					group.contacts.push(contact.key)
				})
			}
		})
	},

	/**
	 * Add contact to group and create groupif not existing
	 *
	 * @param {Object} state the store data
	 * @param {Object} data destructuring object
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
					contacts: []
				})
				group = state.groups.find(search => search.name === groupName)
			}
			group.contacts.push(contact.key)
		})
	},

	/**
	 * Remove contact from group
	 *
	 * @param {Object} state the store data
	 * @param {Object} data destructuring object
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
	 * Delete group
	 *
	 * @param {Object} state the store mutations
	 * @param {Object} group the group to delete
	 */
	deleteGroup(state, group) {
		group = state.groups.find(search => search.name === group.name)
	}
}

const getters = {
	getGroups: state => state.groups
}

const actions = {

	/**
	 * Add contact and to a group
	 *
	 * @param {Object} context the store mutations
	 * @param {Object} data destructuring object
	 * @param {string} data.groupName the name of the group
	 * @param {Contact} data.contact the contact
	 */
	addContactToGroup(context, { groupName, contact }) {
		context.commit('addContactToGroups', { groupNames: [groupName], contact })
	},

	/**
	 * Remove contact from group
	 *
	 * @param {Object} context the store mutations
	 * @param {Object} data destructuring object
	 * @param {string} data.groupName the name of the group
	 * @param {Contact} data.contact the contact
	 */
	removeContactToGroup(context, { groupName, contact }) {
		context.commit('removeContactToGroup', { groupName, contact })
	},

	/**
	 * Delete group
	 *
	 * @param {Object} context the store mutations
	 * @param {Object} group the group to delete
	 */
	deleteGroup(context, group) {
		context.commit('deleteGroup', group)
	}
}

export default { state, mutations, getters, actions }
