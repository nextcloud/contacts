/**
 * @copyright Copyright (c) 2021 John Molakvoæ <skjnldsv@protonmail.com>
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

import { showError } from '@nextcloud/dialogs'
import pLimit from 'p-limit'
import Vue from 'vue'

import Member from '../models/member'
import { getCircles } from '../services/circles'

const circleModel = {
	id: '',
	name: '',
	owner: {},
	members: [],
	initiator: {},
	url: '',
}

const state = {
	circles: [],
}

const mutations = {

	/**
	 * Add a circle into state
	 *
	 * @param {Object} state the store data
	 * @param {Object} circle the circle to add
	 */
	addCircle(state, circle) {
		// extend the circle to the default model
		const newCircle = Object.assign({}, circleModel, circle)
		// force reinit of the members object to prevent
		// data passed as references
		newCircle.members = {}
		state.circles.push(newCircle)
	},

	/**
	 * Delete circle
	 *
	 * @param {Object} state the store data
	 * @param {Object} circle the circle to delete
	 */
	deleteCircle(state, circle) {
		state.circles.splice(state.circles.indexOf(circle), 1)
	},

	/**
	 * Rename a circle
	 *
	 * @param {Object} context the store mutations
	 * @param {Object} data destructuring object
	 * @param {Object} data.circle the circle to rename
	 * @param {string} data.newName the new name of the addressbook
	 */
	renameCircle(context, { circle, newName }) {
		circle = state.circles.find(search => search.id === circle.id)
		circle.displayName = newName
	},

	/**
	 * Append a list of members to a circle
	 * and remove duplicates
	 *
	 * @param {Object} state the store data
	 * @param {Object} data destructuring object
	 * @param {Object} data.circle the circle to add the members to
	 * @param {Member[]} data.members array of contacts to append
	 */
	appendMembersToCircle(state, { circle, members }) {
		circle = state.circles.find(search => search.id === circle.id)

		// convert list into an array and remove duplicate
		circle.members = members.reduce((list, member) => {
			if (list[member.uid]) {
				console.info('Duplicate contact overrided', list[member.uid], member)
			}
			Vue.set(list, member.uid, member)
			return list
		}, circle.members)
	},

	/**
	 * Add a member to a circle and overwrite if duplicate uid
	 *
	 * @param {Object} state the store data
	 * @param {Member} member the member to add
	 */
	addMemberToCircle(state, member) {
		const circle = state.circles.find(search => search.id === member.circle.id)
		Vue.set(circle.members, member.uid, member)
	},

	/**
	 * Delete a contact in a specified circle
	 *
	 * @param {Object} state the store data
	 * @param {Member} member the member to add
	 */
	deleteMemberFromCircle(state, member) {
		const circle = state.circles.find(search => search.id === member.circle.id)
		Vue.delete(circle.members, member.uid)
	},
}

const getters = {
	getCircles: state => state.circles,
}

const actions = {

	/**
	 * Retrieve and commit circles
	 *
	 * @param {Object} context the store mutations
	 * @returns {Object[]} the circles
	 */
	async getCircles(context) {
		const circles = await getCircles()

		circles.forEach(circle => {
			context.commit('addCircle', circle)
		})

		return circles
	},

	/**
	 * Append a new address book to array of existing address books
	 *
	 * @param {Object} context the store mutations
	 * @param {Object} addressbook The address book to append
	 * @returns {Promise}
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
	 * Delete circle
	 *
	 * @param {Object} context the store mutations Current context
	 * @param {Object} circle the circle to delete
	 * @returns {Promise}
	 */
	async deleteCircle(context, circle) {
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
}

export default { state, mutations, getters, actions }
