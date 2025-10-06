/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/// <reference types="@nextcloud/typings" />

import { translate as t } from '@nextcloud/l10n'
import { ShareType } from '@nextcloud/sharing'

export type DefaultGroup = string
export type DefaultChart = string
export type CircleConfig = number
export type MemberLevel = number
export type MemberType = number

// Global sizes
export const LIST_SIZE = 60

// Dynamic default groups
export const GROUP_ALL_CONTACTS: DefaultGroup = t('contacts', 'All contacts')
export const GROUP_NO_GROUP_CONTACTS: DefaultGroup = t('contacts', 'Not grouped')
export const GROUP_RECENTLY_CONTACTED: DefaultGroup = t('contacts', 'Recently contacted')

// Organization default chart for all contacts
export const CHART_ALL_CONTACTS: DefaultChart = t('contacts', 'Organization chart')

// Circle route, see vue-router conf
export const ROUTE_CIRCLE = 'circle'
export const ROUTE_CHART = 'chart'
export const ROUTE_USER_GROUP = 'user_group'

// Contact settings
export const CONTACTS_SETTINGS: DefaultGroup = t('contacts', 'Contacts settings')

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
const MEMBER_TYPE_GROUP: MemberType = 2
const MEMBER_TYPE_MAIL: MemberType = 4
const MEMBER_TYPE_CONTACT: MemberType = 8
const MEMBER_TYPE_CIRCLE: MemberType = 16

export const CIRCLE_DESC = t('contacts', 'Teams are groups of people that you can create yourself and with whom you can share data. They can be made up of other accounts or groups of accounts of the Nextcloud instance, but also of contacts from your address book or even external people by simply entering their e-mail addresses.')

// Circles config flags

const CIRCLE_CONFIG_PERSONAL: CircleConfig = 2 // Personal circle, only the owner can see it.
const CIRCLE_CONFIG_SYSTEM: CircleConfig = 4 // System Circle (not managed by the official front-end). Meaning some config are limited
const CIRCLE_CONFIG_VISIBLE: CircleConfig = 8 // Visible to everyone, if not visible, people have to know its name to be able to find it
const CIRCLE_CONFIG_OPEN: CircleConfig = 16 // Circle is open, people can join
const CIRCLE_CONFIG_INVITE: CircleConfig = 32 // Adding a member generate an invitation that needs to be accepted
const CIRCLE_CONFIG_REQUEST: CircleConfig = 64 // Request to join Circles needs to be confirmed by a moderator
const CIRCLE_CONFIG_FRIEND: CircleConfig = 128 // Members of the circle can invite their friends
const CIRCLE_CONFIG_PROTECTED: CircleConfig = 256 // Password protected to join/request
const CIRCLE_CONFIG_NO_OWNER: CircleConfig = 512 // no owner, only members
const CIRCLE_CONFIG_HIDDEN: CircleConfig = 1024 // hidden from listing, but available as a share entity
const CIRCLE_CONFIG_BACKEND: CircleConfig = 2048 // Fully hidden, only backend Circles
const CIRCLE_CONFIG_LOCAL: CircleConfig = 4096 // Circle is not shared to other instance in globalscale
const CIRCLE_CONFIG_ROOT: CircleConfig = 8192 // Circle cannot be a member of another Circle
const CIRCLE_CONFIG_CIRCLE_INVITE: CircleConfig = 16384 // Circle must confirm when invited in another circle
const CIRCLE_CONFIG_FEDERATED: CircleConfig = 32768 // Federated

// Existing members types
export const CIRCLES_MEMBER_TYPES = {
	[MEMBER_TYPE_CIRCLE]: t('contacts', 'Team'),
	[MEMBER_TYPE_USER]: t('contacts', 'User'),
	[MEMBER_TYPE_GROUP]: t('contacts', 'Group'),
	[MEMBER_TYPE_MAIL]: t('contacts', 'Email'),
	[MEMBER_TYPE_CONTACT]: t('contacts', 'Contact'),
}

// Available circles promote/demote levels
export const CIRCLES_MEMBER_LEVELS = {
	// [MEMBER_LEVEL_NONE]: t('contacts', 'Pending'),
	[MEMBER_LEVEL_MEMBER]: t('contacts', 'Member'),
	[MEMBER_LEVEL_MODERATOR]: t('contacts', 'Moderator'),
	[MEMBER_LEVEL_ADMIN]: t('contacts', 'Admin'),
	[MEMBER_LEVEL_OWNER]: t('contacts', 'Owner'),
}

// Available circle configs in the circle details view
export const PUBLIC_CIRCLE_CONFIG = {
	[t('contacts', 'Invites')]: {
		[CIRCLE_CONFIG_OPEN]: t('contacts', 'Anyone can request membership'),
		[CIRCLE_CONFIG_INVITE]: t('contacts', 'Members need to accept invitation'),
		[CIRCLE_CONFIG_REQUEST]: t('contacts', 'Memberships must be confirmed/accepted by a Moderator (requires "Anyone can request membership")'),
		[CIRCLE_CONFIG_FRIEND]: t('contacts', 'Members can also invite'),
	},

	[t('contacts', 'Membership')]: {
		// TODO: implement backend
		// [CIRCLE_CONFIG_CIRCLE_INVITE]: t('contacts', 'Team must confirm when invited in another circle'),
		[CIRCLE_CONFIG_ROOT]: t('contacts', 'Prevent teams from being a member of another team'),
	},

	[t('contacts', 'Privacy')]: {
		[CIRCLE_CONFIG_VISIBLE]: t('contacts', 'Visible to everyone'),
	},
}

// Represents the picker options (label is used lower case in a list of options: Search users, groups, teams, ...)
// labelStandalone is used as heading for the member list where we need it starting captialized
export const CIRCLES_MEMBER_GROUPING = [
	{
		id: `picker-${ShareType.User}`,
		label: t('contacts', 'users'),
		labelStandalone: t('contacts', 'Users'),
		share: ShareType.User,
		type: MEMBER_TYPE_USER,
	},
	{
		id: `picker-${ShareType.Group}`,
		label: t('contacts', 'groups'),
		labelStandalone: t('contacts', 'Groups'),
		share: ShareType.Group,
		type: MEMBER_TYPE_GROUP,
	},
	// TODO: implement federated
	// {
	// id: `picker-${ShareType.Remote}`,
	// label: t('contacts', 'federated users'),
	// share: ShareType.Remote,
	// type: MEMBER_TYPE_USER
	// },
	// {
	// id: `picker-${ShareType.RemoteGroup}`,
	// label: t('contacts', 'federated groups'),
	// share: ShareType.RemoteGroup,
	// type: MEMBER_TYPE_GROUP
	// },
	{
		id: `picker-${ShareType.Team}`,
		label: t('contacts', 'teams'),
		labelStandalone: t('contacts', 'Teams'),
		share: ShareType.Team,
		type: MEMBER_TYPE_CIRCLE,
	},
	{
		id: `picker-${ShareType.Email}`,
		label: t('contacts', 'email addresses'),
		labelStandalone: t('contacts', 'Email addresses'),
		share: ShareType.Email,
		type: MEMBER_TYPE_MAIL,
	},
	// TODO: implement SHARE_TYPE_CONTACT
	{
		id: 'picker-contact',
		label: t('contacts', 'contacts'),
		labelStandalone: t('contacts', 'Contacts'),
		share: ShareType.Email,
		type: MEMBER_TYPE_CONTACT,
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
	LOCAL = CIRCLE_CONFIG_LOCAL,
	ROOT = CIRCLE_CONFIG_ROOT,
	CIRCLE_INVITE = CIRCLE_CONFIG_CIRCLE_INVITE,
	FEDERATED = CIRCLE_CONFIG_FEDERATED,
}

export enum MemberStatus {
	INVITED = 'Invited',
	MEMBER = 'Member',
	REQUESTING = 'Requesting',
}
