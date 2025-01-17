/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import axios from '@nextcloud/axios'
import { generateOcsUrl } from '@nextcloud/router'

export const setDefaultContact = async function(contactId) {
	const request = await axios.post(generateOcsUrl('apps/contacts/api/v1/default'), {
		contactId,
	})
	return request.data
}
