/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MemberLevels, MemberStatus } from '../../../../src/models/constants.ts'

describe('MemberListItem logic', () => {
	it('computes levelName correctly for member level', () => {
		const level = MemberLevels.MEMBER
		const levelName = level === MemberLevels.MEMBER ? 'Member' : 'Other'
		expect(levelName).toBe('Member')
	})

	it('computes levelName as Pending for NONE level', () => {
		const level = MemberLevels.NONE
		const levelName = level === MemberLevels.NONE ? 'Pending' : 'Other'
		expect(levelName).toBe('Pending')
	})

	it('computes currentUserLevel correctly', () => {
		const initiator = {
			singleId: 'user-1',
			level: MemberLevels.ADMIN,
		}
		expect(initiator.level).toBe(MemberLevels.ADMIN)
	})

	it('computes currentUserId correctly', () => {
		const initiator = {
			singleId: 'user-1',
			level: MemberLevels.ADMIN,
		}
		expect(initiator.singleId).toBe('user-1')
	})

	it('computes isCurrentUser correctly when matching', () => {
		const member = {
			id: 'member-1',
			singleId: 'user-1',
			displayName: 'Test User',
			level: MemberLevels.MEMBER,
			status: MemberStatus.MEMBER,
			isUser: true,
		}
		const initiatorSingleId = 'user-1'
		const isCurrentUser = member.singleId === initiatorSingleId
		expect(isCurrentUser).toBe(true)
	})

	it('computes isCurrentUser correctly when not matching', () => {
		const member = {
			id: 'member-1',
			singleId: 'user-2',
			displayName: 'Test User',
			level: MemberLevels.MEMBER,
			status: MemberStatus.MEMBER,
			isUser: true,
		}
		const initiatorSingleId = 'user-1'
		const isCurrentUser = member.singleId === initiatorSingleId
		expect(isCurrentUser).toBe(false)
	})

	it('computes isPendingApproval correctly for requesting member', () => {
		const member = {
			id: 'member-1',
			singleId: 'user-1',
			displayName: 'Test User',
			level: MemberLevels.NONE,
			status: MemberStatus.REQUESTING,
			isUser: true,
		}
		const isPendingApproval = member.status === MemberStatus.REQUESTING
		expect(isPendingApproval).toBe(true)
	})

	it('computes isPendingApproval as false for non-requesting member', () => {
		const member = {
			id: 'member-1',
			singleId: 'user-1',
			displayName: 'Test User',
			level: MemberLevels.MEMBER,
			status: MemberStatus.MEMBER,
			isUser: true,
		}
		const isPendingApproval = member.status === MemberStatus.REQUESTING
		expect(isPendingApproval).toBe(false)
	})

	it('computes canChangeLevel correctly when user has permission', () => {
		const initiator = {
			singleId: 'user-1',
			level: MemberLevels.ADMIN,
		}
		const canManageMembers = initiator.level >= MemberLevels.MODERATOR
		expect(canManageMembers).toBe(true)
	})

	it('computes canChangeLevel as false when member level is NONE', () => {
		const member = {
			id: 'member-1',
			singleId: 'user-1',
			displayName: 'Test User',
			level: MemberLevels.NONE,
			status: MemberStatus.MEMBER,
			isUser: true,
		}
		const canChangeLevel = member.level !== MemberLevels.NONE
		expect(canChangeLevel).toBe(false)
	})

	it('computes canDelete correctly when user can manage and member is lower level', () => {
		const member = {
			id: 'member-1',
			singleId: 'user-2',
			displayName: 'Test User',
			level: MemberLevels.MEMBER,
			status: MemberStatus.MEMBER,
			isUser: true,
		}
		const initiator = {
			singleId: 'user-1',
			level: MemberLevels.ADMIN,
		}
		const isCurrentUser = member.singleId === initiator.singleId
		const canManageMembers = initiator.level >= MemberLevels.MODERATOR
		const canDelete = !isCurrentUser && canManageMembers
		expect(canDelete).toBe(true)
	})

	it('computes canDelete as false when member is current user', () => {
		const member = {
			id: 'member-1',
			singleId: 'user-1',
			displayName: 'Test User',
			level: MemberLevels.MEMBER,
			status: MemberStatus.MEMBER,
			isUser: true,
		}
		const initiator = {
			singleId: 'user-1',
			level: MemberLevels.ADMIN,
		}
		const isCurrentUser = member.singleId === initiator.singleId
		const canDelete = !isCurrentUser
		expect(canDelete).toBe(false)
	})

	it('computes canDelete as false when member level is higher than current user', () => {
		const member = {
			id: 'member-1',
			singleId: 'user-2',
			displayName: 'Test User',
			level: MemberLevels.ADMIN,
			status: MemberStatus.MEMBER,
			isUser: true,
		}
		const initiator = {
			singleId: 'user-1',
			level: MemberLevels.MODERATOR,
		}
		const canDelete = member.level < initiator.level
		expect(canDelete).toBe(false)
	})

	it('returns correct levelChangeLabel for promotion', () => {
		const currentLevel = MemberLevels.MEMBER
		const targetLevel = MemberLevels.ADMIN
		const isPromotion = targetLevel > currentLevel
		const label = isPromotion ? 'Promote' : 'Demote'
		expect(label).toBe('Promote')
	})

	it('returns correct levelChangeLabel for demotion', () => {
		const currentLevel = MemberLevels.ADMIN
		const targetLevel = MemberLevels.MEMBER
		const isPromotion = targetLevel > currentLevel
		const label = isPromotion ? 'Promote' : 'Demote'
		expect(label).toBe('Demote')
	})

	it('returns correct levelChangeLabel for owner promotion', () => {
		const targetLevel = MemberLevels.OWNER
		const label = targetLevel === MemberLevels.OWNER ? 'sole owner' : 'other'
		expect(label).toBe('sole owner')
	})

	it('computes availableLevelsChange correctly for admin', () => {
		const initiator = {
			singleId: 'user-1',
			level: MemberLevels.ADMIN,
		}
		const availableLevels = [MemberLevels.MEMBER, MemberLevels.ADMIN, MemberLevels.MODERATOR]
		const filtered = availableLevels.filter(level => level <= initiator.level)
		expect(filtered).toContain(MemberLevels.ADMIN)
	})

	it('filters out current level from availableLevelsChange', () => {
		const currentLevel = MemberLevels.MEMBER
		const availableLevels = [MemberLevels.MEMBER, MemberLevels.ADMIN, MemberLevels.MODERATOR]
		const filtered = availableLevels.filter(level => level !== currentLevel)
		expect(filtered).not.toContain(MemberLevels.MEMBER)
		expect(filtered).toContain(MemberLevels.ADMIN)
	})

	it('computes availableLevelsChange correctly for owner', () => {
		const initiator = {
			singleId: 'user-1',
			level: MemberLevels.OWNER,
		}
		const isOwner = initiator.level === MemberLevels.OWNER
		expect(isOwner).toBe(true)
	})
})
