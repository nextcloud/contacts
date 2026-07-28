/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { MemberLevel } from './constants.ts'

import logger from '../services/logger.js'
import { MemberLevels } from './constants.ts'

export default class Member {
	_data: any = {}

	/**
	 * Creates an instance of Member
	 *
	 * @param data
	 */
	constructor(data: any) {
		if (typeof data !== 'object') {
			throw new Error('Invalid member')
		}

		// if no uid set, fail
		if (data.id && typeof data.id !== 'string') {
			logger.error('This member do not have a proper uid', data)
			throw new Error('This member do not have a proper uid')
		}

		this._data = data
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
	 * Member level
	 *
	 */
	get level(): MemberLevel {
		return this._data.level
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
	 * Member request status
	 *
	 */
	get status(): string {
		return this._data.status
	}

	/**
	 * Is the current member a user?
	 */
	get isUser() {
		return this._data.userType === MemberLevels.MEMBER
	}
}
