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
import Member from './member';
declare type MemberList = Record<string, Member>;
export default class Circle {
    _data: any;
    _members: MemberList;
    _owner: Member;
    _initiator: Member;
    /**
     * Creates an instance of Circle
     */
    constructor(data: Object);
    /**
     * Update inner circle data, owner and initiator
     */
    updateData(data: any): void;
    /**
     * Circle id
     */
    get id(): string;
    /**
     * Formatted display name
     */
    get displayName(): string;
    /**
     * Set the display name
     */
    set displayName(text: string);
    /**
     * Circle creation date
     */
    get creation(): number;
    /**
     * Circle description
     */
    get description(): string;
    /**
     * Circle description
     */
    set description(text: string);
    /**
     * Circle member count
     */
    get population(): any;
    /**
     * Circle ini_initiator the current
     * user info for this circle
     */
    get initiator(): Member;
    /**
     * Circle ownership
     */
    get owner(): Member;
    /**
     * Set new circle owner
     */
    set owner(owner: Member);
    /**
     * Circle members
     */
    get members(): MemberList;
    /**
     * Define members circle
     */
    set members(members: MemberList);
    /**
     * Add a member to this circle
     */
    addMember(member: Member): void;
    /**
     * Remove a member from this circle
     */
    deleteMember(member: Member): void;
    get settings(): any;
    /**
     * Circle config
     */
    get config(): number;
    /**
     * Define circle config
     */
    set config(config: number);
    /**
     * Circle requires invite to be confirmed by moderator or above
     */
    get requireJoinAccept(): boolean;
    /**
     * Circle can be requested to join
     */
    get canJoin(): boolean;
    /**
     * Circle is visible to others
     */
    get isVisible(): boolean;
    /**
     * Circle requires invite to be accepted by the member
     */
    get requireInviteAccept(): boolean;
    /**
     * Can the initiator add members to this circle?
     */
    get isOwner(): boolean;
    /**
     * Is the initiator a member of this circle?
     */
    get isMember(): boolean;
    /**
     * Can the initiator delete this circle?
     */
    get canDelete(): boolean;
    /**
     * Can the initiator leave this circle?
     */
    get canLeave(): boolean;
    /**
     * Can the initiator add/remove members to this circle?
     */
    get canManageMembers(): boolean;
    /**
     * Vue router param
     */
    get router(): {
        name: string;
        params: {
            selectedCircle: string;
        };
    };
    /**
     * Default javascript fallback
     * Used for sorting as well
     */
    toString(): string;
}
export {};
