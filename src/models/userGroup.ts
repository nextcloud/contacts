/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ROUTE_USER_GROUP } from './constants.ts'

export default class UserGroup {
	private _data: object
	private _members: string[]

	constructor(group: object) {
		this._data = group
		this._members = []
	}

	addMember(member: object) {
		if (!this._members.includes(member)) {
			this._members.push(member)
		}
	}

	get id(): string {
		return this._data.id
	}

	get displayName(): string {
		return this._data.displayname
	}

	get population(): number {
		return this._data.usercount
	}

	get canLeave(): boolean {
		// users can't leave groups
		return false
	}

	get isOwner(): boolean {
		return false
	}

	get isMember(): boolean {
		// Only the groups that a user has been added to will be visible to them
		return true
	}

	get canManageMembers(): boolean {
		return false
	}

	get canJoin(): boolean {
		return false
	}

	get members(): string[] {
		return this._members
	}

	get router(): object {
		return {
			name: 'user_group',
			params: { selectedUserGroup: this.id, selectedGroup: ROUTE_USER_GROUP },
		}
	}

	toString(): string {
		return this.displayName
	}
}
