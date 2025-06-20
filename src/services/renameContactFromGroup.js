/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import axios from '@nextcloud/axios'
import Contact from '../models/contact.js'

/**
 * Rename a group for a contact
 *
 * @param {Contact} contact the contact model
 * @param {string} oldGroupName name that gets removed
 * @param {string} newGroupName name that gets added
 */
const renameContactFromGroup = async function(contact, oldGroupName, newGroupName) {
	const foundGroups = contact.groups
	foundGroups.push(newGroupName)

	let currentGroups = foundGroups.map(groupName => encodeURIComponent(groupName))

	currentGroups = currentGroups.filter(e => e !== encodeURIComponent(oldGroupName))

	return axios.patch(contact.url, {}, {
		headers: {
			'X-PROPERTY': 'CATEGORIES',
			'X-PROPERTY-REPLACE': currentGroups.join(','),
		},
	})
}

export default renameContactFromGroup
