/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
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

/** @typedef { import('./member') } Member */

import {
	MEMBER_LEVEL_MODERATOR, MEMBER_LEVEL_NONE, MEMBER_LEVEL_OWNER,
	CIRCLE_CONFIG_REQUEST, CIRCLE_CONFIG_INVITE, CIRCLE_CONFIG_OPEN, CIRCLE_CONFIG_VISIBLE,
} from './constants'

import Vue from 'vue'
import Member from './member'

export default class Circle {

	_data = {}
	_members = {}

	/**
	 * Creates an instance of Circle
	 *
	 * @param {Object} data the vcard data as string with proper new lines
	 * @param {object} circle the addressbook which the contat belongs to
	 * @memberof Circle
	 */
	constructor(data) {
		this.updateData(data)
	}

	/**
	 * Update inner circle data, owner and initiator
	 * @param {Object} data the vcard data as string with proper new lines
	 * @memberof Circle
	 */
	updateData(data) {
		if (typeof data !== 'object') {
			throw new Error('Invalid circle')
		}

		// if no uid set, fail
		if (!data.id) {
			throw new Error('This circle do not have a proper uid')
		}

		this._data = data
		this._data.initiator = new Member(data.initiator, this)
		this._data.owner = new Member(data.owner)
	}

	// METADATA -----------------------------------------
	/**
	 * Circle id
	 * @readonly
	 * @memberof Circle
	 * @returns {string}
	 */
	get id() {
		return this._data.id
	}

	/**
	 * Formatted display name
	 * @readonly
	 * @memberof Circle
	 * @returns {string}
	 */
	get displayName() {
		return this._data.displayName
	}

	/**
	 * Circle creation date
	 * @readonly
	 * @memberof Circle
	 * @returns {number}
	 */
	get creation() {
		return this._data.creation
	}

	/**
	 * Circle description
	 * @readonly
	 * @memberof Circle
	 * @returns {string}
	 */
	get description() {
		return this._data.description
	}

	/**
	 * Circle description
	 * @param {string} text circle description
	 * @memberof Circle
	 */
	set description(text) {
		this._data.description = text
	}

	// MEMBERSHIP -----------------------------------------
	/**
	 * Circle initiator. This is the current
	 * user info for this circle
	 * @readonly
	 * @memberof Circle
	 * @returns {Member}
	 */
	get initiator() {
		return this._data.initiator
	}

	/**
	 * Circle ownership
	 * @readonly
	 * @memberof Circle
	 * @returns {Member}
	 */
	get owner() {
		return this._data.owner
	}

	/**
	 * Set new circle owner
	 * @param {Member} owner circle owner
	 * @memberof Circle
	 */
	set owner(owner) {
		if (owner.constructor.name !== Member.name) {
			throw new Error('Owner must be a Member type')
		}
		this._data.owner = owner
	}

	/**
	 * Circle members
	 * @readonly
	 * @memberof Circle
	 * @returns {Member[]}
	 */
	get members() {
		return this._members
	}

	/**
	 * Define members circle
	 * @param {Member[]} members the members list
	 * @memberof Circle
	 */
	set members(members) {
		this._members = members
	}

	/**
	 * Add a member to this circle
	 * @param {Member} member the member to add
	 */
	addMember(member) {
		if (member.constructor.name !== Member.name) {
			throw new Error('Member must be a Member type')
		}

		const uid = member.id
		if (this._members[uid]) {
			console.warn('Duplicate member overrided', this._members[uid], member)
		}
		Vue.set(this._members, uid, member)
	}

	/**
	 * Remove a member from this circle
	 * @param {Member} member the member to delete
	 */
	deleteMember(member) {
		if (member.constructor.name !== Member.name) {
			throw new Error('Member must be a Member type')
		}

		const uid = member.id
		if (!this._members[uid]) {
			console.warn('The member was not in this circle. Nothing was done.', member)
		}

		// Delete and clear memory
		Vue.delete(this._members, uid)
	}

	// CONFIGS --------------------------------------------
	get settings() {
		return this._data.settings
	}

	/**
	 * Circle config
	 * @readonly
	 * @memberof Circle
	 * @returns {number}
	 */
	get config() {
		return this._data.config
	}

	/**
	 * Circle requires invite to be confirmed by moderator or above
	 * @readonly
	 * @memberof Circle
	 * @returns {boolean}
	 */
	get requireJoinAccept() {
		return (this._data.config & CIRCLE_CONFIG_REQUEST) !== 0
	}

	/**
	 * Circle can be requested to join
	 * @readonly
	 * @memberof Circle
	 * @returns {boolean}
	 */
	get canJoin() {
		return (this._data.config & CIRCLE_CONFIG_OPEN) !== 0
	}

	/**
	 * Circle is visible to others
	 * @readonly
	 * @memberof Circle
	 * @returns {boolean}
	 */
	get isVisible() {
		return (this._data.config & CIRCLE_CONFIG_VISIBLE) !== 0
	}

	/**
	 * Circle requires invite to be accepted by the member
	 * @readonly
	 * @memberof Circle
	 * @returns {boolean}
	 */
	get requireInviteAccept() {
		return (this._data.config & CIRCLE_CONFIG_INVITE) !== 0
	}

	// PERMISSIONS SHORTCUTS ------------------------------
	/**
	 * Can the initiator add members to this circle?
	 * @readonly
	 * @memberof Circle
	 * @returns {boolean}
	 */
	get isOwner() {
		return this.initiator.level === MEMBER_LEVEL_OWNER
	}

	/**
	 * Is the initiator a member of this circle?
	 * @readonly
	 * @memberof Circle
	 * @returns {boolean}
	 */
	get isMember() {
		return this.initiator.level > MEMBER_LEVEL_NONE
	}

	/**
	 * Can the initiator delete this circle?
	 * @readonly
	 * @memberof Circle
	 * @returns {boolean}
	 */
	get canDelete() {
		return this.isOwner
	}

	/**
	 * Can the initiator add/remove members to this circle?
	 * @readonly
	 * @memberof Circle
	 * @returns {boolean}
	 */
	get canManageMembers() {
		return this.initiator.level >= MEMBER_LEVEL_MODERATOR
	}

	// PARAMS ---------------------------------------------
	/**
	 * Vue router param
	 * @readonly
	 * @memberof Circle
	 * @returns {Object}
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
	 * @memberof Circle
	 * @returns {string}
	 */
	toString() {
		return this.displayName
	}

}
