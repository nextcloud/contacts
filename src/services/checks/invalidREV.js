/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import ICAL from 'ical.js'

// https://tools.ietf.org/html/rfc6350#section-6.7.4

export default {
	name: 'invalid REV',
	silent: true,

	run: (contact) => {
		try {
			const hasRev = contact.vCard.hasProperty('rev')
			return !hasRev
		} catch (error) {
			return true
		}
	},

	fix: (contact) => {
		try {
			// removing old invalid data
			contact.vCard.removeProperty('rev')

			// creating new value
			const version = contact.version
			if (version === '4.0') {
				contact.vCard.addPropertyWithValue('rev', ICAL.Time.fromJSDate(new Date(), true))
			}
			if (version === '3.0') {
				contact.vCard.addPropertyWithValue('rev', ICAL.VCardTime.fromDateAndOrTimeString(new Date().toISOString(), 'date-time'))
			}

			return true
		} catch (error) {
			console.error('Error fixing invalid REV:', error)
			return false
		}
	},
}
