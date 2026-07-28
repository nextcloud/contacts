/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { ShareType } from '@nextcloud/sharing'
export type DefaultGroup = string
export type DefaultChart = string
export type MemberLevel = number
export type MemberType = number
export declare const LIST_SIZE = 60
export declare const GROUP_ALL_CONTACTS: DefaultGroup
export declare const GROUP_NO_GROUP_CONTACTS: DefaultGroup
export declare const GROUP_RECENTLY_CONTACTED: DefaultGroup
export declare const CHART_ALL_CONTACTS: DefaultChart
export declare const ROUTE_CHART = 'chart'
export declare const CONTACTS_SETTINGS: DefaultGroup
export declare const ELLIPSIS_COUNT = 5

export declare const SHARES_TYPES_MEMBER_MAP: object
export declare enum MemberLevels {
	NONE,
	MEMBER,
	MODERATOR,
	ADMIN,
	OWNER,
}

export declare enum MemberStatus {
	INVITED = 'Invited',
	MEMBER = 'Member',
	REQUESTING = 'Requesting',
}
