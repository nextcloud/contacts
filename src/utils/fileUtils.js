/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
