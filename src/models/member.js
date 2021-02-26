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

/** @typedef { import('./circle') } Circle */

import { MEMBER_TYPE_USER } from './constants'

import Circle from './circle'
import Vue from 'vue'
export default class Member {

	/** @typedef Circle */
	_circle
	_data = {}

	/**
	 * Creates an instance of Contact
	 *
	 * @param {Object} data the vcard data as string with proper new lines
	 * @param {Circle} circle the addressbook which the contat belongs to
	 * @memberof Member
	 */
	constructor(data, circle) {
		if (typeof data !== 'object') {
			throw new Error('Invalid member')
		}

		// if no uid set, fail
		if (data.id && typeof data.id !== 'string') {
			console.error('This member do not have a proper uid', data)
			throw new Error('This member do not have a proper uid')
		}

		this._circle = circle
		this._data = data
	}

	/**
	 * Get the circle of this member
	 * @readonly
	 * @memberof Member
	 */
	get circle() {
		return this._circle
	}

	/**
	 * Set the circle of this member
	 * @param {Circle} circle the circle
	 * @memberof Member
	 */
	set circle(circle) {
		if (circle.constructor.name !== Circle.name) {
			throw new Error('circle must be a Circle type')
		}
		this._circle = circle
	}

	/**
	 * Member id
	 * @readonly
	 * @memberof Member
	 */
	get id() {
		return this._data.id
	}

	/**
	 * Formatted display name
	 * @readonly
	 * @memberof Member
	 */
	get displayName() {
		return this._data.displayName
	}

	/**
	 * Member userId
	 * @readonly
	 * @memberof Member
	 */
	get userId() {
		return this._data.userId
	}

	/**
	 * Member level
	 * @see file src/models/constants.js
	 * @readonly
	 * @memberof Member
	 */
	get level() {
		return this._data.level
	}

	/**
	 * Is the current member a user?
	 * @readonly
	 * @memberof Member
	 */
	get isUser() {
		return this._data.userType === MEMBER_TYPE_USER
	}

	/**
	 * Is the current member without a circle?
	 * @readonly
	 * @memberof Member
	 */
	get isOrphan() {
		return this._circle?.constructor?.name !== 'Circle'
	}

	/**
	 * Delete this member and any reference from its circle
	 */
	delete() {
		if (this.isOrphan) {
			throw new Error('Cannot delete this member as it doesn\'t belong to any circle')
		}
		this.circle.deleteMember(this)
		this._circle = undefined
		this._data = undefined
	}

}
