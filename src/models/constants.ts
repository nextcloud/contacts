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

interface OC extends 	Nextcloud.Common.OC {
	Share: any
}
declare const OC: OC

export type CircleConfig = number
export type MemberLevel = number
export type MemberType = number

// Global sizes
export const LIST_SIZE = 60

// Dynamic groups
export const GROUP_ALL_CONTACTS = t('contacts', 'All contacts')
export const GROUP_NO_GROUP_CONTACTS = t('contacts', 'Not grouped')
export const GROUP_RECENTLY_CONTACTED = t('contactsinteraction', 'Recently contacted')

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

// Circles config flags
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

export const CIRCLES_MEMBER_TYPES = {
	[MEMBER_TYPE_CIRCLE]: t('circles', 'Circle'),
	[MEMBER_TYPE_USER]: t('circles', 'User'),
	[MEMBER_TYPE_GROUP]: t('circles', 'Group'),
	[MEMBER_TYPE_MAIL]: t('circles', 'Mail'),
	[MEMBER_TYPE_CONTACT]: t('circles', 'Contact'),
}

export const CIRCLES_MEMBER_LEVELS = {
	// [MEMBER_LEVEL_NONE]: t('circles', 'None'),
	[MEMBER_LEVEL_MEMBER]: t('circles', 'Member'),
	[MEMBER_LEVEL_MODERATOR]: t('circles', 'Moderator'),
	[MEMBER_LEVEL_ADMIN]: t('circles', 'Admin'),
	[MEMBER_LEVEL_OWNER]: t('circles', 'Owner'),
}

export const SHARES_TYPES_MEMBER_MAP = {
	[OC.Share.SHARE_TYPE_CIRCLE]: MEMBER_TYPE_SINGLEID,
	[OC.Share.SHARE_TYPE_USER]: MEMBER_TYPE_USER,
	[OC.Share.SHARE_TYPE_GROUP]: MEMBER_TYPE_GROUP,
	[OC.Share.SHARE_TYPE_EMAIL]: MEMBER_TYPE_MAIL,
	// []: MEMBER_TYPE_CONTACT,
}

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
