/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { MemberLevel, MemberType } from './constants.ts'
export default class Member {
	_data: any
	/**
	 * Creates an instance of Member
	 *
	 * @param data
	 */
	constructor(data: any)
	get id(): string
	/**
	 * Single uid
	 */
	get singleId(): string
	/**
	 * Formatted display name
	 */
	get displayName(): string
	/**
	 * Member userId
	 */
	get userId(): string
	/**
	 * Member based on source
	 */
	get basedOn(): any
	/**
	 * Member level
	 *
	 */
	get level(): MemberLevel
	/**
	 * Set member level
	 */
	set level(level: MemberLevel)
	/**
	 * Member request status
	 *
	 */
	get status(): string
	/**
	 * Is the current member a user?
	 */
	get isUser(): boolean
	/**
	 * Delete this member
	 */
	delete(): void
}
