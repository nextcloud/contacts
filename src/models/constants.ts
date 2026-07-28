/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/// <reference types="@nextcloud/typings" />

import { translate as t } from '@nextcloud/l10n'

export type DefaultGroup = string
export type DefaultChart = string
export type MemberLevel = number
export type MemberType = number

// Global sizes
export const LIST_SIZE = 60

// Dynamic default groups
export const GROUP_ALL_CONTACTS: DefaultGroup = t('contacts', 'All contacts')
export const GROUP_NO_GROUP_CONTACTS: DefaultGroup = t('contacts', 'Not grouped')
export const GROUP_RECENTLY_CONTACTED: DefaultGroup = 'Recently contacted'

// Organization default chart for all contacts
export const CHART_ALL_CONTACTS: DefaultChart = t('contacts', 'Organization chart')

export const ROUTE_CHART = 'chart'
export const ROUTE_USER_GROUP = 'user_group'
export const ROUTE_ADDRESSBOOK = 'addressbook'

// Contact settings
export const CONTACTS_SETTINGS: DefaultGroup = t('contacts', 'Contacts settings')

// Default max number of items to show in the navigation
export const ELLIPSIS_COUNT = 5

// member levels
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

// Existing members types
export const CIRCLES_MEMBER_TYPES = {
	[MEMBER_TYPE_CIRCLE]: t('contacts', 'Team'),
	[MEMBER_TYPE_USER]: t('contacts', 'User'),
	[MEMBER_TYPE_GROUP]: t('contacts', 'Group'),
	[MEMBER_TYPE_MAIL]: t('contacts', 'Email'),
	[MEMBER_TYPE_CONTACT]: t('contacts', 'Contact'),
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

export enum MemberStatus {
	INVITED = 'Invited',
	MEMBER = 'Member',
	REQUESTING = 'Requesting',
}
