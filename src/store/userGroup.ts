/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { defineStore } from 'pinia'
import UserGroup from '../models/userGroup.ts'
import logger from '../services/logger.js'
import { getUserGroupMembers, getUserGroups } from '../services/userGroup.ts'

export default defineStore('userGroup', {
	state: () => ({
		userGroups: {},
	}),

	getters: {
		userGroupList: (state) => Object.values(state.userGroups),
		getUserGroup: (state) => (groupId: string) => state.userGroups[groupId],
	},

	actions: {
		async getUserGroups(userId: string): Promise<object[]> {
			const userGroups = await getUserGroups(userId)

			userGroups.forEach((group) => {
				try {
					const newUserGroup = new UserGroup(group)
					this.userGroups[newUserGroup.id] = newUserGroup
				} catch (error) {
					logger.error('Failed to add group', { group, error })
				}
			})

			return userGroups
		},
		async getUserGroupMembers(groupId: string): Promise<string[]> {
			const members = await getUserGroupMembers(groupId)

			members.forEach((member) => {
				this.getUserGroup(groupId).addMember(member)
			})

			return members
		},
	},
})
