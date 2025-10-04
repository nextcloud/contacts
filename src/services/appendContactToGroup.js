/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import axios from '@nextcloud/axios'

/**
 * Append a group to a contact
 *
 * @param {Contact} contact the contact model
 * @param {string} groupName the group name
 */
async function appendContactToGroup(contact, groupName) {
	const groups = contact.groups
	groups.push(groupName)

	return axios.patch(contact.url, {}, {
		headers: {
			'X-PROPERTY': 'CATEGORIES',
			'X-PROPERTY-REPLACE': groups.map((groupName) => encodeURIComponent(groupName)).join(','),
		},
	})
}

export default appendContactToGroup
