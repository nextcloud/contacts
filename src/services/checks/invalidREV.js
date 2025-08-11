/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import ICAL from 'ical.js'

// https://tools.ietf.org/html/rfc6350#section-6.7.4

export default {
	name: 'invalid REV',
	silent: true,

	run: contact => {
		try {
			const hasRev = contact.vCard.hasProperty('rev')
			const rev = hasRev && contact.vCard.getFirstProperty('rev')
			const revValue = rev && rev.getFirstValue()

			if (revValue) {
				const version = contact.version
				const type = revValue.icalclass

				if (version === '3.0' && type === 'vcardtime') {
					return false
				}

				if (version === '4.0' && type === 'icaltime') {
					return false
				}
			}
		} catch (error) {
			return true
		}
		return true
	},

	fix: contact => {
		try {
			// removing old invalid data
			contact.vCard.removeProperty('rev')

			// creatiing new value
			contact.vCard.addPropertyWithValue('rev', ICAL.VCardTime.now().convertToZone(ICAL.Timezone.utcTimezone))

			return true
		} catch (error) {
			return false
		}
	},
}
