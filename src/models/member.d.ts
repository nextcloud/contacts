/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
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
import { MemberLevel, MemberType } from './constants';
import Circle from './circle';
export default class Member {
    _data: any;
    _circle: Circle;
    /**
     * Creates an instance of Member
     */
    constructor(data: any, circle: Circle);
    /**
     * Get the circle of this member
     */
    get circle(): Circle;
    /**
     * Set the circle of this member
     */
    set circle(circle: Circle);
    /**
     * Member id
     */
    get id(): string;
    /**
     * Single uid
     */
    get singleId(): string;
    /**
     * Formatted display name
     */
    get displayName(): string;
    /**
     * Member userId
     */
    get userId(): string;
    /**
     * Member type
     */
    get userType(): MemberType;
    /**
     * Member based on source
     */
    get basedOn(): any;
    /**
     * Member level
     *
     */
    get level(): MemberLevel;
    /**
     * Member request status
     *
     */
    get status(): string;
    /**
     * Set member level
     */
    set level(level: MemberLevel);
    /**
     * Is the current member a user?
     */
    get isUser(): boolean;
    /**
     * Is the current member without a circle?
     */
    get isOrphan(): boolean;
    /**
     * Delete this member and any reference from its circle
     */
    delete(): void;
}
