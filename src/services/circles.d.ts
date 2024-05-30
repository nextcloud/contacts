/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { MemberLevel, MemberType } from '../models/constants';
interface MemberPairs {
    id: string;
    type: MemberType;
}
type CircleEditType = 'name' | 'description' | 'settings' | 'config';
export declare enum CircleEdit {
    Name = "name",
    Description = "description",
    Settings = "settings",
    Config = "config"
}
interface CircleSetting {
    setting: string;
    value: string;
}
/**
 * Get the circles list without the members
 *
 * @return {Array}
 */
export declare const getCircles: () => Promise<any>;
/**
 * Get a specific circle
 *
 * @param {string} circleId
 * @return {object}
 */
export declare const getCircle: (circleId: string) => Promise<any>;
/**
 * Create a new circle
 *
 * @param {string} name the circle name
 * @param personal
 * @param local
 * @return {object}
 */
export declare const createCircle: (name: string, personal: boolean, local: boolean) => Promise<any>;
/**
 * Delete an existing circle
 *
 * @param {string} circleId the circle id
 * @return {object}
 */
export declare const deleteCircle: (circleId: string) => Promise<any>;
/**
 * Edit an existing circle
 *
 * @param {string} circleId the circle id
 * @param {CircleEditType} type the edit type
 * @param {any} data the data
 * @param value
 * @return {object}
 */
export declare const editCircle: (circleId: string, type: CircleEditType, value: any) => Promise<any>;
/**
 * Join a circle
 *
 * @param {string} circleId the circle id
 * @return {Array}
 */
export declare const joinCircle: (circleId: string) => Promise<any>;
/**
 * Leave a circle
 *
 * @param {string} circleId the circle id
 * @return {Array}
 */
export declare const leaveCircle: (circleId: string) => Promise<any>;
/**
 * Get the circle members without the members
 *
 * @param {string} circleId the circle id
 * @return {Array}
 */
export declare const getCircleMembers: (circleId: string) => Promise<any>;
/**
 * Search a potential circle member
 *
 * @param {string} term the search query
 * @return {Array}
 */
export declare const searchMember: (term: string) => Promise<any>;
/**
 * Add a circle member
 *
 * @param {string} circleId the circle id
 * @param {string} members the member id
 * @return {Array}
 */
export declare const addMembers: (circleId: string, members: Array<MemberPairs>) => Promise<any>;
/**
 * Delete a circle member
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @return {Array}
 */
export declare const deleteMember: (circleId: string, memberId: string) => Promise<unknown[]>;
/**
 * change a member level
 *
 * @see levels file src/models/constants.js
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @param {number} level the new member level
 * @return {Array}
 */
export declare const changeMemberLevel: (circleId: string, memberId: string, level: MemberLevel) => Promise<unknown[]>;
/**
 * Accept a circle member request
 *
 * @param {string} circleId the circle id
 * @param {string} memberId the member id
 * @return {Array}
 */
export declare const acceptMember: (circleId: string, memberId: string) => Promise<any>;
export declare const editCircleSetting: (circleId: string, setting: CircleSetting) => Promise<any>;
export {};
