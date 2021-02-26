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
/* eslint-disable no-tabs */

// Dynamic groups
export const GROUP_ALL_CONTACTS = t('contacts', 'All contacts')
export const GROUP_NO_GROUP_CONTACTS = t('contacts', 'Not grouped')
export const GROUP_RECENTLY_CONTACTED = t('contactsinteraction', 'Recently contacted')

// Default max number of items to show in the navigation
export const ELLIPSIS_COUNT = 5

// Circles member levels
export const MEMBER_LEVEL_NONE = 0
export const MEMBER_LEVEL_MEMBER = 1
export const MEMBER_LEVEL_MODERATOR = 4
export const MEMBER_LEVEL_ADMIN = 8
export const MEMBER_LEVEL_OWNER = 9

// Circles member types
export const MEMBER_TYPE_CIRCLE = 16
export const MEMBER_TYPE_USER = 1
export const MEMBER_TYPE_GROUP = 2
export const MEMBER_TYPE_MAIL = 3
export const MEMBER_TYPE_CONTACT = 4

// Circles config flags
export const CIRCLE_CONFIG_SYSTEM = 4				// System Circle (not managed by the official front-end). Meaning some config are limited
export const CIRCLE_CONFIG_VISIBLE = 8				// Visible to everyone, if not visible, people have to know its name to be able to find it
export const CIRCLE_CONFIG_OPEN = 16				// Circle is open, people can join
export const CIRCLE_CONFIG_INVITE = 32				// Adding a member generate an invitation that needs to be accepted
export const CIRCLE_CONFIG_REQUEST = 64				// Request to join Circles needs to be confirmed by a moderator
export const CIRCLE_CONFIG_FRIEND = 128				// Members of the circle can invite their friends
export const CIRCLE_CONFIG_PROTECTED = 256			// Password protected to join/request
export const CIRCLE_CONFIG_NO_OWNER = 512			// no owner, only members
export const CIRCLE_CONFIG_HIDDEN = 1024			// hidden from listing, but available as a share entity
export const CIRCLE_CONFIG_BACKEND = 2048			// Fully hidden, only backend Circles
export const CIRCLE_CONFIG_ROOT = 4096				// Circle cannot be inside another Circle
export const CIRCLE_CONFIG_CIRCLE_INVITE = 8192		// Circle must confirm when invited in another circle
export const CIRCLE_CONFIG_FEDERATED = 16384		// Federated

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
