/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { ShareType } from '@nextcloud/sharing';
export type DefaultGroup = string;
export type DefaultChart = string;
export type CircleConfig = number;
export type MemberLevel = number;
export type MemberType = number;
export declare const LIST_SIZE = 60;
export declare const GROUP_ALL_CONTACTS: DefaultGroup;
export declare const GROUP_NO_GROUP_CONTACTS: DefaultGroup;
export declare const GROUP_RECENTLY_CONTACTED: DefaultGroup;
export declare const CHART_ALL_CONTACTS: DefaultChart;
export declare const ROUTE_CIRCLE = "circle";
export declare const ROUTE_CHART = "chart";
export declare const CONTACTS_SETTINGS: DefaultGroup;
export declare const ELLIPSIS_COUNT = 5;
export declare const CIRCLE_DESC: string;
export declare const CIRCLES_MEMBER_TYPES: {
    [x: number]: string;
};
export declare const CIRCLES_MEMBER_LEVELS: {
    [x: number]: string;
};
export declare const PUBLIC_CIRCLE_CONFIG: {
    [x: string]: {
        [x: number]: string;
    };
};
export declare const CIRCLES_MEMBER_GROUPING: {
    id: string;
    label: string;
    share: ShareType;
    type: number;
}[];
export declare const SHARES_TYPES_MEMBER_MAP: {};
export declare enum MemberLevels {
    NONE,
    MEMBER,
    MODERATOR,
    ADMIN,
    OWNER
}
export declare enum MemberTypes {
    CIRCLE,
    USER,
    GROUP,
    MAIL,
    CONTACT
}
export declare enum CircleConfigs {
    PERSONAL,
    SYSTEM,
    VISIBLE,
    OPEN,
    INVITE,
    REQUEST,
    FRIEND,
    PROTECTED,
    NO_OWNER,
    HIDDEN,
    BACKEND,
    LOCAL,
    ROOT,
    CIRCLE_INVITE,
    FEDERATED
}
export declare enum MemberStatus {
    INVITED = "Invited",
    MEMBER = "Member",
    REQUESTING = "Requesting"
}
