/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type Member from './member.ts'
type MemberList = Record<string, Member>
export default class Circle {
	_data: any
	_members: MemberList
	_owner: Member
	_initiator: Member
	/**
	 * Creates an instance of Circle
	 *
	 * @param data
	 */
	constructor(data: object)
	/**
	 * Update inner circle data, owner and initiator
	 *
	 * @param data
	 */
	updateData(data: any): void
	/**
	 * Circle id
	 */
	get id(): string
	/**
	 * Formatted display name
	 */
	get displayName(): string
	/**
	 * Set the display name
	 */
	set displayName(text: string)
	/**
	 * Circle creation date
	 */
	get creation(): number
	/**
	 * Circle description
	 */
	get description(): string
	/**
	 * Circle description
	 */
	set description(text: string)
	/**
	 * Circle member count
	 */
	get population(): any
	/**
	 * Circle ini_initiator the current
	 * user info for this circle
	 * null if not a member
	 */
	get initiator(): Member | null
	/**
	 * Set new circle initiator
	 * null if not a member
	 */
	set initiator(initiator: Member | null)
	/**
	 * Circle ownership
	 */
	get owner(): Member
	/**
	 * Set new circle owner
	 */
	set owner(owner: Member)
	/**
	 * Circle members
	 */
	get members(): MemberList
	/**
	 * Define members circle
	 */
	set members(members: MemberList)
	/**
	 * Add a member to this circle
	 *
	 * @param member
	 */
	addMember(member: Member): void
	/**
	 * Remove a member from this circle
	 *
	 * @param member
	 */
	deleteMember(member: Member): void
	get settings(): any
	/**
	 * Circle config
	 */
	get config(): number
	/**
	 * Define circle config
	 */
	set config(config: number)
	/**
	 * Circle is personal
	 */
	get isPersonal(): boolean
	/**
	 * Circle requires invite to be confirmed by moderator or above
	 */
	get requireJoinAccept(): boolean
	/**
	 * Circle can be requested to join
	 */
	get canJoin(): boolean
	/**
	 * Circle is visible to others
	 */
	get isVisible(): boolean
	/**
	 * Circle requires invite to be accepted by the member
	 */
	get requireInviteAccept(): boolean
	/**
	 * Can the initiator add members to this circle?
	 */
	get isOwner(): boolean
	/**
	 * Is the initiator an admin of this circle?
	 */
	get isAdmin(): boolean
	/**
	 * Is the initiator a member of this circle?
	 */
	get isMember(): boolean | 0 | undefined
	/**
	 * Is the initiator a pending member of this circle?
	 */
	get isPendingMember(): boolean
	/**
	 * Can the initiator delete this circle?
	 */
	get canDelete(): boolean
	/**
	 * Can the initiator leave this circle?
	 */
	get canLeave(): boolean | 0 | undefined
	/**
	 * Can the initiator add/remove members to this circle?
	 */
	get canManageMembers(): boolean
	/**
	 * Vue router param
	 */
	get router(): {
		name: string
		params: {
			selectedCircle: string
		}
	}
	/**
	 * Default javascript fallback
	 * Used for sorting as well
	 */
	toString(): string
}
export {}
