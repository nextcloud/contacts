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

/**
 * the FN field is mandatory. If there is none we need to
 * create it based on the available data
 */
export default {
	name: 'missing FN',
	run: contact => {
		return !contact.vCard.hasProperty('fn') // No FN
			|| contact.vCard.getFirstPropertyValue('fn') === '' // Empty FN
			|| ( // we don't want to fix newly created contacts
				contact.dav // Existing contact
				&& contact.vCard.getFirstPropertyValue('fn')
					.toLowerCase() === t('contacts', 'New contact').toLowerCase() // AND Unchanged FN
			)
	},
	fix: contact => {
		if (contact.vCard.hasProperty('n')) {
			// Stevenson;John;Philip,Paul;Dr.;Jr.,M.D.,A.C.P.
			// -> John Stevenson
			const n = contact.vCard.getFirstPropertyValue('n')
			const fullName = n.slice(0, 2).reverse().join(' ')
			if (fullName && fullName.trim() !== '') {
				contact.fullName = fullName
				return true
			}
			return false
		}
		return false
	},
}
