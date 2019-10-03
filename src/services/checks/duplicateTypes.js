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

export default {
	name: 'duplicate types',
	run: contact => {
		try {
			const props = contact.vCard.getAllProperties()
				.map(prop => prop.getParameter('type'))
				.filter(prop => prop)
			const fixed = props.map(prop => [...new Set(prop)])
			if (props
				&& Array.isArray(props)
				&& props.length > 0
				&& props.join('') !== fixed.join('')) {
				return true
			}
		} catch (error) {
			return false
		}
		return false
	},
	fix: contact => {
		let results = false
		try {
			const props = contact.vCard.getAllProperties()
			props.forEach(prop => {
				const icalString = prop.toICALString()
				// ['WORK', 'pref', 'pref'] => ['WORK', 'pref']
				const param = prop.getParameter('type')
				const fixed = [...new Set(param)]
				if (param
					&& Array.isArray(param)
					&& param.join('') !== fixed.join('')) {
					prop.setParameter('type', fixed)
					console.debug('Additional debug: duplicate types', { old: icalString, new: prop.toICALString() })
					results = true
				}
			})
		} catch (error) {
			console.error(error)
		}
		return results
	}
}
