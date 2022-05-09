/**
 * @copyright Copyright (c) 2019 John Molakvoæ <skjnldsv@protonmail.com>
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

import { VCardTime } from 'ical.js'

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

				if (version === '4.0' && type === 'vcardtime') {
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
			const rev = new VCardTime(null, null, 'date-time')
			rev.fromUnixTime(Date.now() / 1000)
			contact.vCard.addPropertyWithValue('rev', rev)

			return true
		} catch (error) {
			return false
		}
	},
}
