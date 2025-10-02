import type Circle from './circle.ts'
/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { MemberLevel, MemberType } from './constants.ts'
export default class Member {
	_data: any
	_circle: Circle
	/**
	 * Creates an instance of Member
	 *
	 * @param data
	 * @param circle
	 */
	constructor(data: any, circle: Circle)
	/**
	 * Get the circle of this member
	 */
	get circle(): Circle
	/**
	 * Set the circle of this member
	 */
	set circle(circle: Circle)
	/**
	 * Member id
	 */
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
	 * Member type
	 */
	get userType(): MemberType
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
	 * Is the current member without a circle?
	 */
	get isOrphan(): boolean
	/**
	 * Delete this member and any reference from its circle
	 */
	delete(): void
}
