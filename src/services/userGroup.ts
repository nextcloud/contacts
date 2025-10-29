/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import axios from '@nextcloud/axios'
import { generateOcsUrl } from '@nextcloud/router'

export async function getUserGroups(userId: string): string[] {
	const response = await axios.get(generateOcsUrl('/cloud/users/{userId}/groups/details', { userId }))
	return response.data.ocs.data.groups
}

export async function getUserGroupMembers(groupId: string): string[] {
	const response = await axios.get(generateOcsUrl('/cloud/groups/{groupId}/users', { groupId }))
	return response.data.ocs.data.users
}
