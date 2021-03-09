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

import axios from '@nextcloud/axios'
import { generateOcsUrl } from '@nextcloud/router'
import { CIRCLES_MEMBER_LEVELS } from '../models/constants'

const baseApi = generateOcsUrl('apps/circles', 2)

/**
 * Get the circles list without the members
 *
 * @returns {Array}
 */
export const getCircles = async function() {
	const response = await axios.get(baseApi + 'circles')
	return response.data.ocs.data
}

/**
 * Create a new circle
 *
 * @param {string} name the circle name
 * @returns {Object}
 */
export const createCircle = async function(name) {
	const response = await axios.post(baseApi + 'circles', {
		name,
	})
	return response.data.ocs.data
}

/**
 * Delete an existing circle
 *
 * @param {string} circleId the circle name
 * @returns {Object}
 */
export const deleteCircle = async function(circleId) {
	const response = await axios.delete(baseApi + `circles/${circleId}`)
	return response.data.ocs.data
}

/**
 * Join a circle
 *
 * @param {string} circleId the circle name
 * @returns {Array}
 */
export const joinCircle = async function(circleId) {
	const response = await axios.put(baseApi + `circles/${circleId}/join`)
	return response.data.ocs.data
}

/**
 * Leave a circle
 *
 * @param {string} circleId the circle name
 * @returns {Array}
 */
export const leaveCircle = async function(circleId) {
	const response = await axios.put(baseApi + `circles/${circleId}/leave`)
	return response.data.ocs.data
}

/**
 * Get the circle members without the members
 *
 * @param {string} circleId the circle id
 * @returns {Array}
 */
export const getCircleMembers = async function(circleId) {
	const response = await axios.get(baseApi + `circles/${circleId}/members`)
	return Object.values(response.data.ocs.data)
}

/**
 * Add a circle member
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @returns {Array}
 */
export const addMember = async function(circleId, memberId) {
	const response = await axios.delete(baseApi + `circles/${circleId}/members/${memberId}`)
	return Object.values(response.data.ocs.data)
}

/**
 * Delete a circle member
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @returns {Array}
 */
export const deleteMember = async function(circleId, memberId) {
	const response = await axios.delete(baseApi + `circles/${circleId}/members/${memberId}`)
	return Object.values(response.data.ocs.data)
}

/**
 * change a member level
 * @see levels file src/models/constants.js
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @param {number} level the new member level
 * @returns {Array}
 */
export const changeMemberLevel = async function(circleId, memberId, level) {
	if (!(level in CIRCLES_MEMBER_LEVELS)) {
		throw new Error('Invalid level. Valid levels are', CIRCLES_MEMBER_LEVELS)
	}

	const response = await axios.put(baseApi + `circles/${circleId}/members/${memberId}}/level`, {
		level,
	})
	return Object.values(response.data.ocs.data)
}
