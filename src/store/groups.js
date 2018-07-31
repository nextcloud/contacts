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

const state = {
	groups: []
}
const mutations = {
	/**
	 * Extract all the groups from the provided contacts
	 *
	 * @param {Object} state
	 * @param {Contact[]} contacts
	 */
	appendGroups(state, contacts) {
		// init groups list
		let groups = Object.values(contacts)
			.map(contact => contact.groups.map(group => {
				return {
					name: group,
					contacts: []
				}
			})[0])
		state.groups = state.groups.concat(groups)
			.filter(function(group, index, self) {
				return group && self.findIndex(search => search && search.name === group.name) === index
			})
		// append keys to groups
		Object.values(contacts)
			.forEach(contact => {
				if (contact.groups) {
					contact.groups.forEach(group => {
						state.groups.find(search => search.name === group).contacts.push(contact.key)
					})
				}
			})
	}
}

const getters = {
	getGroups(state) {
		return state.groups
	}
}

const actions = {}

export default { state, mutations, getters, actions }
