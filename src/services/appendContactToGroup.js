/**
 * @copyright Copyright (c) 2020 John Molakvoæ <skjnldsv@protonmail.com>
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
import axios from '@nextcloud/axios'

/**
 * Append a group to a contact
 *
 * @param {Contact} contact the contact model
 * @param {string} groupName the group name
 */
const appendContactToGroup = async function(contact, groupName) {
	const groups = contact.groups
	groups.push(groupName)

	return axios.patch(contact.url, {}, {
		headers: {
			'X-PROPERTY': 'CATEGORIES',
			'X-PROPERTY-REPLACE': groups.join(','),
		},
	})
}

export default appendContactToGroup
