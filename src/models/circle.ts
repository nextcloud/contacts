/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Vue from 'vue'
import Member from './member'

import { CircleConfigs, MemberLevels } from './constants'

type MemberList = Record<string, Member>

/* eslint-disable @typescript-eslint/no-explicit-any */
export default class Circle {

	_data: any = {}
	_members: MemberList = {}
	_owner: Member
	_initiator: Member

	/**
	 * Creates an instance of Circle
	 *
	 * @param data
	 */
	constructor(data: object) {
		this.updateData(data)
	}

	/**
	 * Update inner circle data, owner and initiator
	 *
	 * @param data
	 */
	updateData(data: any) {
		if (typeof data !== 'object') {
			throw new Error('Invalid circle')
		}

		// if no uid set, fail
		if (!data.id) {
			throw new Error('This circle do not have a proper uid')
		}

		this._data = data
		this._owner = new Member(data.owner, this)

		if (data.initiator) {
			this._initiator = new Member(data.initiator, this)
		}
	}

	// METADATA -----------------------------------------
	/**
	 * Circle id
	 */
	get id(): string {
		return this._data.id
	}

	/**
	 * Formatted display name
	 */
	get displayName(): string {
		return this._data.displayName
	}

	/**
	 * Set the display name
	 */
	set displayName(text: string) {
		this._data.displayName = text
	}

	/**
	 * Circle creation date
	 */
	get creation(): number {
		return this._data.creation
	}

	/**
	 * Circle description
	 */
	get description(): string {
		return this._data.description
	}

	/**
	 * Circle description
	 */
	set description(text: string) {
		this._data.description = text
	}

	/**
	 * Circle member count
	 */
	get population() {
		return this._data.population
	}

	// MEMBERSHIP -----------------------------------------
	/**
	 * Circle ini_initiator the current
	 * user info for this circle
	 * null if not a member
	 */
	get initiator(): Member|null {
		return this._initiator
	}

	/**
	 * Set new circle initiator
	 * null if not a member
	 */
	set initiator(initiator: Member|null) {
		if (initiator && initiator.constructor.name !== Member.name) {
			throw new Error('Initiator must be a Member type')
		}
		Vue.set(this, '_initiator', initiator)
	}

	/**
	 * Circle ownership
	 */
	get owner(): Member {
		return this._owner
	}

	/**
	 * Set new circle owner
	 */
	set owner(owner: Member) {
		if (owner.constructor.name !== Member.name) {
			throw new Error('Owner must be a Member type')
		}
		Vue.set(this, '_owner', owner)
	}

	/**
	 * Circle members
	 */
	get members(): MemberList {
		return this._members
	}

	/**
	 * Define members circle
	 */
	set members(members: MemberList) {
		this._members = members
	}

	/**
	 * Add a member to this circle
	 *
	 * @param member
	 */
	addMember(member: Member) {
		if (member.constructor.name !== Member.name) {
			throw new Error('Member must be a Member type')
		}

		const singleId = member.singleId
		if (this._members[singleId]) {
			console.warn('Replacing existing member data', member)
		}
		Vue.set(this._members, singleId, member)
	}

	/**
	 * Remove a member from this circle
	 *
	 * @param member
	 */
	deleteMember(member: Member) {
		if (member.constructor.name !== Member.name) {
			throw new Error('Member must be a Member type')
		}

		const singleId = member.singleId
		if (!this._members[singleId]) {
			console.warn('The member was not in this circle. Nothing was done.', member)
		}

		// Delete and clear memory
		Vue.delete(this._members, singleId)
	}

	// CONFIGS --------------------------------------------
	get settings() {
		return this._data.settings
	}

	/**
	 * Circle config
	 */
	get config(): number {
		return this._data.config
	}

	/**
	 * Define circle config
	 */
	set config(config: number) {
		this._data.config = config
	}

	/**
	 * Circle is personal
	 */
	get isPersonal() {
		return (this._data.config & CircleConfigs.PERSONAL) !== 0
	}

	/**
	 * Circle requires invite to be confirmed by moderator or above
	 */
	get requireJoinAccept() {
		return (this._data.config & CircleConfigs.VISIBLE) !== 0
	}

	/**
	 * Circle can be requested to join
	 */
	get canJoin() {
		return (this._data.config & CircleConfigs.OPEN) !== 0
	}

	/**
	 * Circle is visible to others
	 */
	get isVisible() {
		return (this._data.config & CircleConfigs.VISIBLE) !== 0
	}

	/**
	 * Circle requires invite to be accepted by the member
	 */
	get requireInviteAccept() {
		return (this._data.config & CircleConfigs.INVITE) !== 0
	}

	// PERMISSIONS SHORTCUTS ------------------------------
	/**
	 * Can the initiator add members to this circle?
	 */
	get isOwner() {
		return this.initiator?.level === MemberLevels.OWNER
	}

	// PERMISSIONS SHORTCUTS ------------------------------
	/**
	 * Is the initiator an admin of this circle?
	 */
	get isAdmin() {
		return this.initiator?.level === MemberLevels.ADMIN
	}

	/**
	 * Is the initiator a member of this circle?
	 */
	get isMember() {
		return this.initiator?.level
			&& this.initiator?.level > MemberLevels.NONE
	}

	/**
	 * Is the initiator a pending member of this circle?
	 */
	get isPendingMember() {
		return this.initiator?.level === MemberLevels.NONE
	}

	/**
	 * Can the initiator delete this circle?
	 */
	get canDelete() {
		return this.isOwner
	}

	/**
	 * Can the initiator leave this circle?
	 */
	get canLeave() {
		return this.isMember && !this.isOwner
	}

	/**
	 * Can the initiator add/remove members to this circle?
	 */
	get canManageMembers() {
		return (this.initiator?.level
			&& this.initiator?.level >= MemberLevels.MODERATOR)
			|| (this.config & CircleConfigs.FRIEND) !== 0
	}

	// PARAMS ---------------------------------------------
	/**
	 * Vue router param
	 */
	get router() {
		return {
			name: 'circle',
			params: { selectedCircle: this.id },
		}
	}

	/**
	 * Default javascript fallback
	 * Used for sorting as well
	 */
	toString() {
		return this.displayName
	}

}
