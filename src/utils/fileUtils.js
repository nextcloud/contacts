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
import camelcase from 'camelcase'
import { isNumber } from './numberUtils.js'

export const formatObject = function(obj) {
	const data = {}

	Object.keys(obj).forEach(key => {
		const data = obj[key]

		// flatten object if any
		if (!!data && typeof data === 'object') {
			Object.assign(data, formatObject(data))
		} else {
			// format key and add it to the data
			if (data === 'false') {
				data[camelcase(key)] = false
			} else if (data === 'true') {
				data[camelcase(key)] = true
			} else {
				data[camelcase(key)] = isNumber(data)
					? Number(data)
					: data
			}
		}
	})
	return data
}
