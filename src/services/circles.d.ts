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
import { MemberLevel, MemberType } from '../models/constants';
interface MemberPairs {
    id: string;
    type: MemberType;
}
declare type CircleEditType = 'name' | 'description' | 'settings' | 'config';
export declare enum CircleEdit {
    Name = "name",
    Description = "description",
    Settings = "settings",
    Config = "config"
}
/**
 * Get the circles list without the members
 *
 * @returns {Array}
 */
export declare const getCircles: () => Promise<any>;
/**
 * Get a specific circle
 * @param {string} circleId
 * @returns {Object}
 */
export declare const getCircle: (circleId: string) => Promise<any>;
/**
 * Create a new circle
 *
 * @param {string} name the circle name
 * @returns {Object}
 */
export declare const createCircle: (name: string, personal: boolean, local: boolean) => Promise<any>;
/**
 * Delete an existing circle
 *
 * @param {string} circleId the circle id
 * @returns {Object}
 */
export declare const deleteCircle: (circleId: string) => Promise<any>;
/**
 * Edit an existing circle
 *
 * @param {string} circleId the circle id
 * @param {CircleEditType} type the edit type
 * @param {any} data the data
 * @returns {Object}
 */
export declare const editCircle: (circleId: string, type: CircleEditType, value: any) => Promise<any>;
/**
 * Join a circle
 *
 * @param {string} circleId the circle id
 * @returns {Array}
 */
export declare const joinCircle: (circleId: string) => Promise<any>;
/**
 * Leave a circle
 *
 * @param {string} circleId the circle id
 * @returns {Array}
 */
export declare const leaveCircle: (circleId: string) => Promise<any>;
/**
 * Get the circle members without the members
 *
 * @param {string} circleId the circle id
 * @returns {Array}
 */
export declare const getCircleMembers: (circleId: string) => Promise<any>;
/**
 * Search a potential circle member
 *
 * @param {string} term the search query
 * @returns {Array}
 */
export declare const searchMember: (term: string) => Promise<any>;
/**
 * Add a circle member
 *
 * @param {string} circleId the circle id
 * @param {string} members the member id
 * @returns {Array}
 */
export declare const addMembers: (circleId: string, members: Array<MemberPairs>) => Promise<any>;
/**
 * Delete a circle member
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @returns {Array}
 */
export declare const deleteMember: (circleId: string, memberId: string) => Promise<unknown[]>;
/**
 * change a member level
 * @see levels file src/models/constants.js
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @param {number} level the new member level
 * @returns {Array}
 */
export declare const changeMemberLevel: (circleId: string, memberId: string, level: MemberLevel) => Promise<unknown[]>;
/**
 * Accept a circle member request
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @returns {Array}
 */
export declare const acceptMember: (circleId: string, memberId: string) => Promise<any>;
export {};
