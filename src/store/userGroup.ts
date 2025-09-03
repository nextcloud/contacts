/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getUserGroups, getUserGroupMembers } from '../services/userGroup.ts'
import logger from '../services/logger.js'
import UserGroup from '../models/userGroup.ts'

import { defineStore } from 'pinia'

export default defineStore('userGroup', {
	state: () => ({
		userGroups: {},
	}),

	getters: {
		userGroupList: (state) => Object.values(state.userGroups),
		getUserGroup: (state) => (groupId: string) => state.userGroups[groupId],
	},

	actions: {
		async getUserGroups(userId: string): object[] {
			const userGroups = await getUserGroups(userId)

			userGroups.forEach(group => {
				try {
					const newUserGroup = new UserGroup(group)
					this.userGroups[newUserGroup.id] = newUserGroup
				} catch (error) {
					logger.error('Failed to add group', { group, error })
				}
			})

			return userGroups
		},
		async getUserGroupMembers(groupId: string): string[] {
			const members = await getUserGroupMembers(groupId)

			members.forEach(member => {
				this.getUserGroup(groupId).addMember(member)
			})

			return members
		},
	},
})
