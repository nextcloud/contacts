/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/dialogs', () => ({ DialogBuilder: jest.fn(), showError: jest.fn() }))
jest.mock('@nextcloud/vue', () => ({}))
jest.mock('../../../src/mixins/RouterMixin.js', () => ({}))
jest.mock('../../../src/models/circle.ts', () => ({}))
jest.mock('../../../src/services/circles.ts', () => ({}))

import MemberGridItem from '../../../src/components/MemberList/MemberGridItem.vue'
import { CircleConfigs, MemberLevels } from '../../../src/models/constants.ts'

const { computed } = MemberGridItem.default || MemberGridItem

/**
 * Evaluate the permission computeds for `member` as seen by `initiator`.
 *
 * @param {object} initiator the current user's membership
 * @param {object} member the member row being rendered
 * @param {number} config the circle config bitmask
 */
function permissions(initiator, member, config = 0) {
	const circle = {
		initiator,
		isOwner: initiator.level === MemberLevels.OWNER,
		// Mirrors Circle.canManageMembers: "Members can also invite" (FRIEND) grants it to
		// plain members, although the server still requires moderator to remove members
		canManageMembers: initiator.level >= MemberLevels.MODERATOR || (config & CircleConfigs.FRIEND) !== 0,
	}
	const vm = { circle, member }
	vm.currentUserLevel = computed.currentUserLevel.call(vm)
	vm.currentUserId = computed.currentUserId.call(vm)
	vm.isCurrentUser = computed.isCurrentUser.call(vm)
	vm.availableLevelsChange = computed.availableLevelsChange.call(vm)
	return {
		levels: vm.availableLevelsChange,
		canChangeLevel: computed.canChangeLevel.call(vm),
		canDelete: computed.canDelete.call(vm),
	}
}

const user = (id, level) => ({ id: `${id}-member-id`, singleId: id, level })

describe('MemberGridItem permissions', () => {
	test('plain member cannot remove others when members can invite', () => {
		const result = permissions(user('user1', MemberLevels.MEMBER), user('user2', MemberLevels.MEMBER), CircleConfigs.FRIEND)
		expect(result.canDelete).toBe(false)
		expect(result.canChangeLevel).toBe(false)
	})

	test('moderator cannot promote anyone to admin', () => {
		const result = permissions(user('user1', MemberLevels.MODERATOR), user('user2', MemberLevels.MEMBER))
		expect(result.levels).not.toContain(MemberLevels.ADMIN)
		expect(result.canChangeLevel).toBe(false)
	})

	test('moderator has no actions on their own row', () => {
		const self = user('user1', MemberLevels.MODERATOR)
		const result = permissions(self, { ...self })
		expect(result.levels).toEqual([])
		expect(result.canChangeLevel).toBe(false)
		expect(result.canDelete).toBe(false)
	})

	test('moderator can remove lower members but not peers', () => {
		const moderator = user('user1', MemberLevels.MODERATOR)
		expect(permissions(moderator, user('user2', MemberLevels.MEMBER)).canDelete).toBe(true)
		expect(permissions(moderator, user('user3', MemberLevels.MODERATOR)).canDelete).toBe(false)
	})

	test('admin can promote to admin and remove lower members, but not the owner', () => {
		const admin = user('user1', MemberLevels.ADMIN)
		const result = permissions(admin, user('user2', MemberLevels.MEMBER))
		expect(result.levels).toEqual([MemberLevels.ADMIN, MemberLevels.MODERATOR])
		expect(result.canDelete).toBe(true)
		expect(permissions(admin, user('owner', MemberLevels.OWNER)).canDelete).toBe(false)
	})
})
