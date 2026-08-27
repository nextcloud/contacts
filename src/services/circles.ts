/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { MemberLevel, MemberType } from '../models/constants.ts'

import axios from '@nextcloud/axios'
import { generateOcsUrl } from '@nextcloud/router'
import { MemberLevels } from '../models/constants.ts'
interface MemberPairs {
	id: string
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
	setting: string
	value: string
}

/**
 * Get the circles list without the members
 *
 * @return
 */
export async function getCircles() {
	const response = await axios.get(generateOcsUrl('apps/circles/circles'))
	return response.data.ocs.data
}

/**
 * Get a specific circle
 *
 * @param circleId
 * @return
 */
export async function getCircle(circleId: string) {
	const response = await axios.get(generateOcsUrl('apps/circles/circles/{circleId}', { circleId }))
	return response.data.ocs.data
}

/**
 * Create a new circle
 *
 * @param name the circle name
 * @param personal
 * @param local
 * @return
 */
export async function createCircle(name: string, personal: boolean, local: boolean) {
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
 * @param circleId the circle id
 * @return
 */
export async function deleteCircle(circleId: string) {
	const response = await axios.delete(generateOcsUrl('apps/circles/circles/{circleId}', { circleId }))
	return response.data.ocs.data
}

/**
 * Edit an existing circle
 *
 * @param circleId the circle id
 * @param type the edit type
 * @param data the data
 * @param value
 * @return
 */
export async function editCircle(circleId: string, type: CircleEditType, value: any) {
	const response = await axios.put(generateOcsUrl('apps/circles/circles/{circleId}/{type}', { circleId, type }), { value })
	return response.data.ocs.data
}

/**
 * Join a circle
 *
 * @param circleId the circle id
 * @return
 */
export async function joinCircle(circleId: string) {
	const response = await axios.put(generateOcsUrl('apps/circles/circles/{circleId}/join', { circleId }))
	return response.data.ocs.data
}

/**
 * Leave a circle
 *
 * @param circleId the circle id
 * @return
 */
export async function leaveCircle(circleId: string) {
	const response = await axios.put(generateOcsUrl('apps/circles/circles/{circleId}/leave', { circleId }))
	return response.data.ocs.data
}

/**
 * Get the circle members without the members
 *
 * @param circleId the circle id
 * @return
 */
export async function getCircleMembers(circleId: string) {
	const response = await axios.get(generateOcsUrl('apps/circles/circles/{circleId}/members', { circleId }))
	return response.data.ocs.data
}

/**
 * Search a potential circle member
 *
 * @param term the search query
 * @return
 */
export async function searchMember(term: string) {
	const response = await axios.get(generateOcsUrl('apps/circles/search?term={term}', { term }))
	return response.data.ocs.data
}

/**
 * Add a circle member
 *
 * @param circleId the circle id
 * @param members the member id
 * @return
 */
export async function addMembers(circleId: string, members: Array<MemberPairs>) {
	const response = await axios.post(generateOcsUrl('apps/circles/circles/{circleId}/members/multi', { circleId }), { members })
	return response.data.ocs.data
}

/**
 * Delete a circle member
 *
 * @param circleId the circle id
 * @param memberId the member id
 * @return
 */
export async function deleteMember(circleId: string, memberId: string) {
	const response = await axios.delete(generateOcsUrl('apps/circles/circles/{circleId}/members/{memberId}', { circleId, memberId }))
	return Object.values(response.data.ocs.data)
}

/**
 * change a member level
 *
 * @see levels file src/models/constants.js
 *
 * @param circleId the circle id
 * @param memberId the member id
 * @param level the new member level
 * @return
 */
export async function changeMemberLevel(circleId: string, memberId: string, level: MemberLevel) {
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
 * @param circleId the circle id
 * @param memberId the member id
 * @return
 */
export async function acceptMember(circleId: string, memberId: string) {
	const response = await axios.put(generateOcsUrl('apps/circles/circles/{circleId}/members/{memberId}', { circleId, memberId }))
	return response.data.ocs.data
}

export async function editCircleSetting(circleId: string, setting: CircleSetting) {
	const response = await axios.put(
		generateOcsUrl('apps/circles/circles/{circleId}/setting', { circleId }),
		setting,
	)
	return response.data.ocs.data
}
