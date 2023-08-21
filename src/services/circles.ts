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
import { MemberLevel, MemberLevels, MemberType } from '../models/constants'
interface MemberPairs {
	id: string,
	type: MemberType
}

type CircleEditType = 'name' | 'description' | 'settings' | 'config'
export enum CircleEdit {
	Name = 'name',
	Description = 'description',
	Settings = 'settings',
	Config = 'config',
}

interface CircleSetting {
	setting: string,
	value: string
}

/**
 * Get the circles list without the members
 *
 * @return {Array}
 */
export const getCircles = async function() {
	const response = await axios.get(generateOcsUrl('apps/circles/circles'))
	return response.data.ocs.data
}

/**
 * Get a specific circle
 *
 * @param {string} circleId
 * @return {object}
 */
export const getCircle = async function(circleId: string) {
	const response = await axios.get(generateOcsUrl('apps/circles/circles/{circleId}', { circleId }))
	return response.data.ocs.data
}

/**
 * Create a new circle
 *
 * @param {string} name the circle name
 * @param personal
 * @param local
 * @return {object}
 */
export const createCircle = async function(name: string, personal: boolean, local: boolean) {
	const response = await axios.post(generateOcsUrl('apps/circles/circles'), {
		name,
		personal,
		local,
	})
	return response.data.ocs.data
}

/**
 * Delete an existing circle
 *
 * @param {string} circleId the circle id
 * @return {object}
 */
export const deleteCircle = async function(circleId: string) {
	const response = await axios.delete(generateOcsUrl('apps/circles/circles/{circleId}', { circleId }))
	return response.data.ocs.data
}

/**
 * Edit an existing circle
 *
 * @param {string} circleId the circle id
 * @param {CircleEditType} type the edit type
 * @param {any} data the data
 * @param value
 * @return {object}
 */
export const editCircle = async function(circleId: string, type: CircleEditType, value: any) {
	const response = await axios.put(generateOcsUrl('apps/circles/circles/{circleId}/{type}', { circleId, type }), { value })
	return response.data.ocs.data
}

/**
 * Join a circle
 *
 * @param {string} circleId the circle id
 * @return {Array}
 */
export const joinCircle = async function(circleId: string) {
	const response = await axios.put(generateOcsUrl('apps/circles/circles/{circleId}/join', { circleId }))
	return response.data.ocs.data
}

/**
 * Leave a circle
 *
 * @param {string} circleId the circle id
 * @return {Array}
 */
export const leaveCircle = async function(circleId: string) {
	const response = await axios.put(generateOcsUrl('apps/circles/circles/{circleId}/leave', { circleId }))
	return response.data.ocs.data
}

/**
 * Get the circle members without the members
 *
 * @param {string} circleId the circle id
 * @return {Array}
 */
export const getCircleMembers = async function(circleId: string) {
	const response = await axios.get(generateOcsUrl('apps/circles/circles/{circleId}/members', { circleId }))
	return response.data.ocs.data
}

/**
 * Search a potential circle member
 *
 * @param {string} term the search query
 * @return {Array}
 */
export const searchMember = async function(term: string) {
	const response = await axios.get(generateOcsUrl('apps/circles/search?term={term}', { term }))
	return response.data.ocs.data
}

/**
 * Add a circle member
 *
 * @param {string} circleId the circle id
 * @param {string} members the member id
 * @return {Array}
 */
export const addMembers = async function(circleId: string, members: Array<MemberPairs>) {
	const response = await axios.post(generateOcsUrl('apps/circles/circles/{circleId}/members/multi', { circleId }), { members })
	return response.data.ocs.data
}

/**
 * Delete a circle member
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @return {Array}
 */
export const deleteMember = async function(circleId: string, memberId: string) {
	const response = await axios.delete(generateOcsUrl('apps/circles/circles/{circleId}/members/{memberId}', { circleId, memberId }))
	return Object.values(response.data.ocs.data)
}

/**
 * change a member level
 *
 * @see levels file src/models/constants.js
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @param {number} level the new member level
 * @return {Array}
 */
export const changeMemberLevel = async function(circleId: string, memberId: string, level: MemberLevel) {
	if (!(level in MemberLevels)) {
		throw new Error('Invalid level.')
	}

	const response = await axios.put(generateOcsUrl('apps/circles/circles/{circleId}/members/{memberId}/level', { circleId, memberId }), {
		level,
	})
	return Object.values(response.data.ocs.data)
}

/**
 * Accept a circle member request
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @return {Array}
 */
export const acceptMember = async function(circleId: string, memberId: string) {
	const response = await axios.put(generateOcsUrl('apps/circles/circles/{circleId}/members/{memberId}', { circleId, memberId }))
	return response.data.ocs.data
}

export const editCircleSetting = async function(circleId: string, setting: CircleSetting) {
	const response = await axios.put(
		generateOcsUrl('apps/circles/circles/{circleId}/setting', { circleId }),
		setting,
	)
	return response.data.ocs.data
}
