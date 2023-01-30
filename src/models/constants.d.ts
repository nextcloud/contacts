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
import { Type } from '@nextcloud/sharing';
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
    share: Type;
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
