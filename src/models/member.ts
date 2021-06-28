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

import { MemberLevel, MemberLevels, MemberType, MemberTypes } from './constants'
import Circle from './circle'
import logger from '../services/logger'
export default class Member {

	_data: any = {}
	_circle: Circle

	/**
	 * Creates an instance of Member
	 */
	constructor(data: any, circle: Circle) {
		if (typeof data !== 'object') {
			throw new Error('Invalid member')
		}

		// if no uid set, fail
		if (data.id && typeof data.id !== 'string') {
			logger.error('This member do not have a proper uid', data)
			throw new Error('This member do not have a proper uid')
		}

		this._circle = circle
		this._data = data
	}

	/**
	 * Get the circle of this member
	 */
	get circle(): Circle {
		return this._circle
	}

	/**
	 * Set the circle of this member
	 */
	set circle(circle: Circle) {
		if (circle.constructor.name !== Circle.name) {
			throw new Error('circle must be a Circle type')
		}
		this._circle = circle
	}

	/**
	 * Member id
	 */
	get id(): string {
		return this._data.id
	}

	/**
	 * Single uid
	 */
	get singleId(): string {
		return this._data.singleId
	}

	/**
	 * Formatted display name
	 */
	get displayName(): string {
		return this._data.displayName
	}

	/**
	 * Member userId
	 */
	get userId(): string {
		return this._data.userId
	}

	/**
	 * Member type
	 */
	get userType(): MemberType {
		// If the user type is a circle, this could originate from multiple sources
		return this._data.userType !== MemberTypes.CIRCLE
					? this._data.userType
					: this.basedOn.source
	}

	/**
	 * Member based on source
	 */
	get basedOn(): any {
		return this._data.basedOn
	}

	/**
	 * Member level
	 * 
	 */
	get level(): MemberLevel {
		return this._data.level
	}

	/**
	 * Member request status
	 * 
	 */
	get status(): string {
		return this._data.status
	}

	/**
	 * Set member level
	 */
	set level(level: MemberLevel) {
		if (!(level in MemberLevels)) {
			throw new Error('Invalid level')
		}
		this._data.level = level
	}

	/**
	 * Is the current member a user?
	 */
	get isUser() {
		return this._data.userType === MemberLevels.MEMBER
	}

	/**
	 * Is the current member without a circle?
	 */
	get isOrphan() {
		return this._circle?.constructor?.name !== Circle.name
	}

	/**
	 * Delete this member and any reference from its circle
	 */
	delete() {
		if (this.isOrphan) {
			throw new Error('Cannot delete this member as it doesn\'t belong to any circle')
		}
		this.circle.deleteMember(this)
		this._data = undefined
	}

}
