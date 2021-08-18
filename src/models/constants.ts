/**
 * @copyright Copyright (c) 2021 John Molakvoæ <skjnldsv@protonmail.com>
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
/// <reference types="@nextcloud/typings" />

import { translate as t } from '@nextcloud/l10n'
import { Type } from '@nextcloud/sharing'

export type DefaultGroup = string
export type CircleConfig = number
export type MemberLevel = number
export type MemberType = number

// Global sizes
export const LIST_SIZE = 60

// Dynamic default groups
export const GROUP_ALL_CONTACTS: DefaultGroup = t('contacts', 'All contacts')
export const GROUP_NO_GROUP_CONTACTS: DefaultGroup = t('contacts', 'Not grouped')
export const GROUP_RECENTLY_CONTACTED: DefaultGroup = t('contactsinteraction', 'Recently contacted')

// Circle route, see vue-router conf
export const ROUTE_CIRCLE = 'circle'

// Default max number of items to show in the navigation
export const ELLIPSIS_COUNT = 5

// Circles member levels
const MEMBER_LEVEL_NONE: MemberLevel = 0
const MEMBER_LEVEL_MEMBER: MemberLevel = 1
const MEMBER_LEVEL_MODERATOR: MemberLevel = 4
const MEMBER_LEVEL_ADMIN: MemberLevel = 8
const MEMBER_LEVEL_OWNER: MemberLevel = 9

// Circles member types
const MEMBER_TYPE_SINGLEID: MemberType = 0
const MEMBER_TYPE_USER: MemberType = 1
const MEMBER_TYPE_GROUP : MemberType= 2
const MEMBER_TYPE_MAIL: MemberType = 4
const MEMBER_TYPE_CONTACT: MemberType = 8
const MEMBER_TYPE_CIRCLE: MemberType = 16

export const CIRCLE_DESC = t('contacts', 'Circles allow you to create groups with other users on a Nextcloud instance and share with them.')

// Circles config flags
const CIRCLE_CONFIG_PERSONAL: CircleConfig = 2				// Personal circle, only the owner can see it.
const CIRCLE_CONFIG_SYSTEM: CircleConfig = 4				// System Circle (not managed by the official front-end). Meaning some config are limited
const CIRCLE_CONFIG_VISIBLE: CircleConfig = 8				// Visible to everyone, if not visible, people have to know its name to be able to find it
const CIRCLE_CONFIG_OPEN: CircleConfig = 16					// Circle is open, people can join
const CIRCLE_CONFIG_INVITE: CircleConfig = 32				// Adding a member generate an invitation that needs to be accepted
const CIRCLE_CONFIG_REQUEST: CircleConfig = 64				// Request to join Circles needs to be confirmed by a moderator
const CIRCLE_CONFIG_FRIEND: CircleConfig = 128				// Members of the circle can invite their friends
const CIRCLE_CONFIG_PROTECTED: CircleConfig = 256			// Password protected to join/request
const CIRCLE_CONFIG_NO_OWNER: CircleConfig = 512			// no owner, only members
const CIRCLE_CONFIG_HIDDEN: CircleConfig = 1024				// hidden from listing, but available as a share entity
const CIRCLE_CONFIG_BACKEND: CircleConfig = 2048			// Fully hidden, only backend Circles
const CIRCLE_CONFIG_ROOT: CircleConfig = 4096				// Circle cannot be inside another Circle
const CIRCLE_CONFIG_CIRCLE_INVITE: CircleConfig = 8192		// Circle must confirm when invited in another circle
const CIRCLE_CONFIG_FEDERATED: CircleConfig = 16384			// Federated

// Existing members types
export const CIRCLES_MEMBER_TYPES = {
	[MEMBER_TYPE_CIRCLE]: t('circles', 'Circle'),
	[MEMBER_TYPE_USER]: t('circles', 'User'),
	[MEMBER_TYPE_GROUP]: t('circles', 'Group'),
	[MEMBER_TYPE_MAIL]: t('circles', 'Email'),
	[MEMBER_TYPE_CONTACT]: t('circles', 'Contact'),
}

// Available circles promote/demote levels
export const CIRCLES_MEMBER_LEVELS = {
	// [MEMBER_LEVEL_NONE]: t('circles', 'Pending'),
	[MEMBER_LEVEL_MEMBER]: t('circles', 'Member'),
	[MEMBER_LEVEL_MODERATOR]: t('circles', 'Moderator'),
	[MEMBER_LEVEL_ADMIN]: t('circles', 'Admin'),
	[MEMBER_LEVEL_OWNER]: t('circles', 'Owner'),
}

// Available circle configs in the circle details view
export const PUBLIC_CIRCLE_CONFIG = {
	[t('contacts', 'Invites')]: {
		[CIRCLE_CONFIG_OPEN]: t('contacts', 'Anyone can request membership'),
		[CIRCLE_CONFIG_INVITE]: t('contacts', 'Members need to accept invitation'),
		[CIRCLE_CONFIG_REQUEST]: t('contacts', 'Memberships must be confirmed/accepted by a Moderator (requires Open)'),
		[CIRCLE_CONFIG_FRIEND]: t('contacts', 'Members can also invite'),
		// Let's manage password protection independently as we also need a password
		// [CIRCLE_CONFIG_PROTECTED]: t('contacts', 'Password protect'),
	},

	[t('contacts', 'Visibility')]: {
		[CIRCLE_CONFIG_VISIBLE]: t('contacts', 'Visible to everyone'),
	},

	[t('contacts', 'Circle membership')]: {
		// TODO: implement backend
		// [CIRCLE_CONFIG_CIRCLE_INVITE]: t('contacts', 'Circle must confirm when invited in another circle'),
		[CIRCLE_CONFIG_ROOT]: t('contacts', 'Prevent circle from being a member of another circle'),
	},
}


// Represents the picker options but also the
// sorting of the members list
export const CIRCLES_MEMBER_GROUPING = [
	{
		id: `picker-${Type.SHARE_TYPE_USER}`,
		label: t('contacts', 'Users'),
		share: Type.SHARE_TYPE_USER,
		type: MEMBER_TYPE_USER
	},
	{
		id: `picker-${Type.SHARE_TYPE_GROUP}`,
		label: t('contacts', 'Groups'),
		share: Type.SHARE_TYPE_GROUP,
		type: MEMBER_TYPE_GROUP
	},
	// TODO: implement federated
	// {
	// 	id: `picker-${Type.SHARE_TYPE_REMOTE}`,
	// 	label: t('contacts', 'Federated users'),
	// 	share: Type.SHARE_TYPE_REMOTE,
	// 	type: MEMBER_TYPE_USER
	// },
	// {
	// 	id: `picker-${Type.SHARE_TYPE_REMOTE_GROUP}`,
	// 	label: t('contacts', 'Federated groups'),
	// 	share: Type.SHARE_TYPE_REMOTE_GROUP,
	// 	type: MEMBER_TYPE_GROUP
	// },
	{
		id: `picker-${Type.SHARE_TYPE_CIRCLE}`,
		label: t('contacts', 'Circles'),
		share: Type.SHARE_TYPE_CIRCLE,
		type: MEMBER_TYPE_CIRCLE
	},
	{
		id: `picker-${Type.SHARE_TYPE_EMAIL}`,
		label: t('contacts', 'Emails'),
		share: Type.SHARE_TYPE_EMAIL,
		type: MEMBER_TYPE_MAIL
	},
	// TODO: implement SHARE_TYPE_CONTACT
	{
		id: `picker-contact`,
		label: t('contacts', 'Contacts'),
		share: Type.SHARE_TYPE_EMAIL,
		type: MEMBER_TYPE_CONTACT
	},
]

// Generating a map between share types and circle member types
export const SHARES_TYPES_MEMBER_MAP = CIRCLES_MEMBER_GROUPING.reduce((list, entry) => {
	// ! Ignore duplicate share types
	if (!list[entry.share]) {
		list[entry.share] = entry.type
	}
	return list
}, {})

export enum MemberLevels {
	NONE = MEMBER_LEVEL_NONE,
	MEMBER = MEMBER_LEVEL_MEMBER,
	MODERATOR = MEMBER_LEVEL_MODERATOR,
	ADMIN = MEMBER_LEVEL_ADMIN,
	OWNER = MEMBER_LEVEL_OWNER,
}

export enum MemberTypes {
	CIRCLE = MEMBER_TYPE_CIRCLE,
	USER = MEMBER_TYPE_USER,
	GROUP = MEMBER_TYPE_GROUP,
	MAIL = MEMBER_TYPE_MAIL,
	CONTACT = MEMBER_TYPE_CONTACT,
}

export enum CircleConfigs {
	PERSONAL = CIRCLE_CONFIG_PERSONAL,
	SYSTEM = CIRCLE_CONFIG_SYSTEM,
	VISIBLE = CIRCLE_CONFIG_VISIBLE,
	OPEN = CIRCLE_CONFIG_OPEN,
	INVITE = CIRCLE_CONFIG_INVITE,
	REQUEST = CIRCLE_CONFIG_REQUEST,
	FRIEND = CIRCLE_CONFIG_FRIEND,
	PROTECTED = CIRCLE_CONFIG_PROTECTED,
	NO_OWNER = CIRCLE_CONFIG_NO_OWNER,
	HIDDEN = CIRCLE_CONFIG_HIDDEN,
	BACKEND = CIRCLE_CONFIG_BACKEND,
	ROOT = CIRCLE_CONFIG_ROOT,
	CIRCLE_INVITE = CIRCLE_CONFIG_CIRCLE_INVITE,
	FEDERATED = CIRCLE_CONFIG_FEDERATED,
}

export enum MemberStatus {
	INVITED = 'Invited',
	MEMBER = 'Member',
	REQUESTING = 'Requesting',
}
