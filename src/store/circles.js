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
import Vue from 'vue'

import { createCircle, deleteCircle, deleteMember, getCircleMembers, getCircle, getCircles, leaveCircle, addMembers } from '../services/circles.ts'
import Member from '../models/member.ts'
import Circle from '../models/circle.ts'

const state = {
	/** @type {Object.<string>} Circle */
	circles: {},
}

const mutations = {

	/**
	 * Add a circle into state
	 *
	 * @param {Object} state the store data
	 * @param {Circle} circle the circle to add
	 */
	addCircle(state, circle) {
		if (circle.constructor.name !== Circle.name) {
			throw new Error('circle must be a Circle type')
		}
		Vue.set(state.circles, circle.id, circle)
	},

	/**
	 * Delete circle
	 *
	 * @param {Object} state the store data
	 * @param {Circle} circle the circle to delete
	 */
	deleteCircle(state, circle) {
		if (!(circle.id in state.circles)) {
			console.warn('Skipping deletion of unknown circle', circle)
		}
		Vue.delete(state.circles, circle.id)
	},

	/**
	 * Append a list of members to a circle
	 * and remove duplicates
	 *
	 * @param {Object} state the store data
	 * @param {Members[]} members array of members to append
	 */
	appendMembersToCircle(state, members) {
		members.forEach(member => member.circle.addMember(member))
	},

	/**
	 * Add a member to a circle and overwrite if duplicate uid
	 *
	 * @param {Object} state the store data
	 * @param {Object} data destructuring object
	 * @param {string} data.circleId the circle to add the members to
	 * @param {Member} data.member array of contacts to append
	 */
	addMemberToCircle(state, { circleId, member }) {
		const circle = state.circles[circleId]
		circle.addmember(member)
	},

	/**
	 * Delete a contact in a specified circle
	 *
	 * @param {Object} state the store data
	 * @param {Member} member the member to add
	 */
	deleteMemberFromCircle(state, member) {
		// Circles dependencies are managed directly from the model
		member.delete()
	},
}

const getters = {
	getCircles: state => Object.values(state.circles),
	getCircle: state => (id) => state.circles[id],
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
		console.debug(`Retrieved ${circles.length} circle(s)`, circles)

		let failure = false
		circles.forEach(circle => {
			try {
				const newCircle = new Circle(circle)
				context.commit('addCircle', newCircle)
			} catch (error) {
				failure = true
				console.error('This circle failed to be processed', circle, error)
			}
		})

		if (failure) {
			showError(t('contacts', 'Some circle(s) errored, check the console for more details'))
		}

		return circles
	},

	/**
	 * Retrieve and commit circles
	 *
	 * @param {Object} context the store mutations
	 * @param {string} circleId the circle id
	 * @returns {Object[]} the circles
	 */
	async getCircle(context, circleId) {
		const circle = await getCircle(circleId)
		console.debug('Retrieved 1 circle', circle)

		try {
			const newCircle = new Circle(circle)
			context.commit('addCircle', newCircle)
		} catch (error) {
			console.error('This circle failed to be processed', circle, error)
		}

		return circle
	},

	/**
	 * Retrieve and commit circle members
	 *
	 * @param {Object} context the store mutations
	 * @param {string} circleId the circle id
	 */
	async getCircleMembers(context, circleId) {
		const circle = context.getters.getCircle(circleId)
		const members = await getCircleMembers(circleId)

		console.debug(`${circleId} have ${members.length} member(s)`, members)
		context.commit('appendMembersToCircle', members.map(member => new Member(member, circle)))
	},

	/**
	 * Create circle
	 *
	 * @param {Object} context the store mutations Current context
	 * @param {string} circleName the circle name
	 * @returns {Circle} the new circle
	 */
	async createCircle(context, circleName) {
		try {
			const response = await createCircle(circleName)
			const circle = new Circle(response)
			context.commit('addCircle', circle)
			console.debug('Created circle', circleName, circle)
			return circle
		} catch (error) {
			console.error(error)
			showError(t('contacts', 'Unable to create circle {circleName}', { circleName }))
		}
	},

	/**
	 * Delete circle
	 *
	 * @param {Object} context the store mutations Current context
	 * @param {Circle} circleId the circle to delete
	 */
	async deleteCircle(context, circleId) {
		try {
			await deleteCircle(circleId)
			console.debug('Deleted circle', circleId)
		} catch (error) {
			console.error(error)
			showError(t('contacts', 'Unable to delete circle {circleId}', circleId))
		}
	},

	/**
	 * Add members to a circle
	 *
	 * @param {Object} context the store mutations Current context
	 * @param {Object} data destructuring object
	 * @param {string} data.circleId the circle to manage
	 * @param {Array} data.selection the members to add, see addMembers service
	 * @returns {Member[]}
	 */
	async addMembersToCircle(context, { circleId, selection }) {
		const circle = context.getters.getCircle(circleId)
		const results = await addMembers(circleId, selection)
		const members = results.map(member => new Member(member, circle))

		console.debug('Added members to circle', circle, members)
		context.commit('appendMembersToCircle', members)

		return members
	},

	/**
	 * Delete a member from a circle
	 *
	 * @param {Object} context the store mutations Current context
	 * @param {Member} member the member to remove
	 * @param {boolean} [leave=false] leave the circle instead of removing the member
	 */
	async deleteMemberFromCircle(context, { member, leave = false }) {
		const circleId = member.circle.id
		const memberId = member.id

		if (leave) {
			const circle = await leaveCircle(circleId)
			member.circle.updateData(circle)

			// If the circle is not visible, we remove it from the list
			if (!member.circle.isVisible && !member.circle.isMember) {
				await context.commit('deleteCircle', circle)
				console.debug('Deleted circle', circleId, memberId)
			}
		} else {
			await deleteMember(circleId, memberId)
		}

		// success, let's remove from store
		context.commit('deleteMemberFromCircle', member)
		console.debug('Deleted member', circleId, memberId)
	},

}

export default { state, mutations, getters, actions }
