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

import Contact from '../models/contact'
import checks from './checks/'

/**
 * @param contact
 */
export default function(contact) {
	let result = false
	if (contact instanceof Contact) {

		// Going through every checks
		checks.forEach(check => {
			try {
				if (check.run(contact)) {

					// A fix is needed, running ⏳
					if (!check.fix(contact)) {
						// FAILURE 🙅
						console.warn('The following contact needed a correction that failed:', check.name, contact)
					} else {
						// SUCCESS 💪
						// Only display visual feedback if the fix is not silent
						if (!check.silent) {
							result = true
						}
						console.info('The following contact has been repaired:', check.name, contact)
					}
				}
			} catch (error) {
				console.error('Error during the check:', check.name, contact, error)
			}
		})
		return result
	} else {
		throw new Error('Invalid contact provided')
	}
}
