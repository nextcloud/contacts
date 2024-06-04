/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { showError } from '@nextcloud/dialogs'
import Vue from 'vue'

import {
	acceptMember,
	createCircle,
	deleteCircle,
	deleteMember,
	getCircleMembers,
	getCircle,
	getCircles,
	leaveCircle,
	addMembers,
	editCircleSetting,
} from '../services/circles.ts'
import Member from '../models/member.ts'
import Circle from '../models/circle.ts'
import logger from '../services/logger.js'

const state = {
	/** @type {Object<string>} Circle */
	circles: {},
}

const mutations = {

	/**
	 * Add a circle into state
	 *
	 * @param {object} state the store data
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
	 * @param {object} state the store data
	 * @param {Circle} circle the circle to delete
	 */
	deleteCircle(state, circle) {
		if (!(circle.id in state.circles)) {
			logger.warn('Skipping deletion of unknown circle', { circle })
		}
		Vue.delete(state.circles, circle.id)
	},

	/**
	 * Append a list of members to a circle
	 * and remove duplicates
	 *
	 * @param {object} state the store data
	 * @param {Members[]} members array of members to append
	 */
	appendMembersToCircle(state, members) {
		members.forEach(member => member.circle.addMember(member))
	},

	/**
	 * Add a member to a circle and overwrite if duplicate uid
	 *
	 * @param {object} state the store data
	 * @param {object} data destructuring object
	 * @param {string} data.circleId the circle to add the members to
	 * @param {Member} data.member array of contacts to append
	 */
	addMemberToCircle(state, { circleId, member }) {
		const circle = state.circles[circleId]
		circle.addMember(member)
	},

	/**
	 * Delete a contact in a specified circle
	 *
	 * @param {object} state the store data
	 * @param {Member} member the member to add
	 */
	deleteMemberFromCircle(state, member) {
		// Circles dependencies are managed directly from the model
		member.delete()
	},

	setCircleSettings(state, { circleId, settings }) {
		Vue.set(state.circles[circleId]._data, 'settings', settings)
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
	 * @param {object} context the store mutations
	 * @return {object[]} the circles
	 */
	async getCircles(context) {
		const circles = await getCircles()
		logger.debug(`Retrieved ${circles.length} circle(s)`, { circles })

		let failure = false
		circles.forEach(circle => {
			try {
				const newCircle = new Circle(circle)
				context.commit('addCircle', newCircle)
			} catch (error) {
				failure = true
				logger.error('This circle failed to be processed', { circle, error })
			}
		})

		if (failure) {
			showError(t('contacts', 'An error has occurred in team(s). Check the console for more details.'))
		}

		return circles
	},

	/**
	 * Retrieve and commit circles
	 *
	 * @param {object} context the store mutations
	 * @param {string} circleId the circle id
	 * @return {object[]} the circles
	 */
	async getCircle(context, circleId) {
		const circle = await getCircle(circleId)
		logger.debug('Retrieved 1 circle', { circle })

		try {
			const newCircle = new Circle(circle)
			context.commit('addCircle', newCircle)
		} catch (error) {
			logger.error('This circle failed to be processed', { circle, error })
		}

		return circle
	},

	/**
	 * Retrieve and commit circle members
	 *
	 * @param {object} context the store mutations
	 * @param {string} circleId the circle id
	 */
	async getCircleMembers(context, circleId) {
		const circle = context.getters.getCircle(circleId)
		const members = await getCircleMembers(circleId)

		logger.debug(`${circleId} have ${members.length} member(s)`, { members })
		context.commit('appendMembersToCircle', members.map(member => new Member(member, circle)))
	},

	/**
	 * Create circle
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} data destructuring object
	 * @param {string} data.circleName the circle name
	 * @param {boolean} data.isPersonal the circle is a personal one
	 * @param {boolean} data.isLocal the circle is not distributed to the GlobalScale
	 * @return {Circle} the new circle
	 */
	async createCircle(context, { circleName, isPersonal, isLocal }) {
		try {
			const response = await createCircle(circleName, isPersonal, isLocal)
			const circle = new Circle(response)
			context.commit('addCircle', circle)
			logger.debug('Created circle', { circleName, circle })
			return circle
		} catch (error) {
			console.error(error)
			showError(t('contacts', 'Unable to create team {circleName}', { circleName }))
		}
	},

	/**
	 * Delete circle
	 *
	 * @param {object} context the store mutations Current context
	 * @param {Circle} circleId the circle to delete
	 */
	async deleteCircle(context, circleId) {
		const circle = context.getters.getCircle(circleId)
		try {
			await deleteCircle(circleId)
			context.commit('deleteCircle', circle)
			logger.debug('Deleted circle', { circleId })
		} catch (error) {
			console.error(error)
			showError(t('contacts', 'Unable to delete team {circleId}', circleId))
		}
	},

	/**
	 * Add members to a circle
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} data destructuring object
	 * @param {string} data.circleId the circle to manage
	 * @param {Array} data.selection the members to add, see addMembers service
	 * @return {Member[]}
	 */
	async addMembersToCircle(context, { circleId, selection }) {
		const circle = context.getters.getCircle(circleId)
		const results = await addMembers(circleId, selection)
		const members = results.map(member => new Member(member, circle))

		logger.debug('Added members to circle', { circle, members })
		context.commit('appendMembersToCircle', members)

		return members
	},

	/**
	 * Delete a member from a circle
	 *
	 * @param {object} context the store mutations Current context
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
				logger.debug('Deleted circle', { circleId, memberId })
			}
		} else {
			await deleteMember(circleId, memberId)
		}

		// success, let's remove from store
		context.commit('deleteMemberFromCircle', member)
		logger.debug('Deleted member', { circleId, memberId })
	},

	/**
	 * Accept a circle member request
	 *
	 * @param {object} context the store mutations Current context
	 * @param {object} data destructuring object
	 * @param {string} data.circleId the circle id
	 * @param {string} data.memberId the member id
	 */
	async acceptCircleMember(context, { circleId, memberId }) {
		const circle = context.getters.getCircle(circleId)

		const result = await acceptMember(circleId, memberId)
		const member = new Member(result, circle)

		await context.commit('addMemberToCircle', { circleId, member })
	},

	async editCircleSetting(context, { circleId, setting }) {
		const { settings } = await editCircleSetting(circleId, setting)
		await context.commit('setCircleSettings', {
			circleId,
			settings,
		})
	},

}

export default { state, mutations, getters, actions }
