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

import rfcProps from '../../models/rfcProps.js'

// https://tools.ietf.org/html/rfc6350#section-6.2.7

export default {
	name: 'bad gender type',
	run: contact => {
		return contact.vCard.hasProperty('gender')
			&& contact.vCard.getFirstProperty('gender').getFirstParameter('type')
	},
	fix: contact => {
		const gender = contact.vCard.getFirstProperty('gender')
		const type = gender.getFirstParameter('type')
		const option = Object.values(rfcProps.properties.gender.options).find(opt => opt.id === type)
		if (option) {
			gender.removeParameter('type')
			gender.setValue(option.id)
			return true
		}
		return false
	},
}
