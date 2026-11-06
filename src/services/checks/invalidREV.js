/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { readRev } from '../../utils/rev.js'

// https://tools.ietf.org/html/rfc6350#section-6.7.4

export default {
	name: 'invalid REV',
	silent: true,

	run: (contact) => contact.vCard.hasProperty('rev') && readRev(contact.vCard) === null,

	// an unusable REV is dropped rather than replaced, saving the contact writes a valid one
	fix: (contact) => {
		contact.vCard.removeAllProperties('rev')
		return true
	},
}
