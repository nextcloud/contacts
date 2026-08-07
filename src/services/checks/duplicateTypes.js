/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import logger from '../logger.js'

export default {
	name: 'duplicate types',
	run: (contact) => {
		try {
			const props = contact.vCard.getAllProperties()
				.map((prop) => prop.getParameter('type'))
				.filter((prop) => Array.isArray(prop))
			const fixed = props.map((prop) => [...new Set(prop)])
			if (props.join('') !== fixed.join('')) {
				return true
			}
		} catch (error) {
			return false
		}
		return false
	},
	fix: (contact) => {
		let results = false
		try {
			const props = contact.vCard.getAllProperties()
			props.forEach((prop) => {
				const icalString = prop.toICALString()
				// ['WORK', 'pref', 'pref'] => ['WORK', 'pref']
				const param = prop.getParameter('type')
				const fixed = [...new Set(param)]
				if (param
					&& Array.isArray(param)
					&& param.join('') !== fixed.join('')) {
					prop.setParameter('type', fixed)
					logger.debug('Additional debug: duplicate types', { old: icalString, new: prop.toICALString() })
					results = true
				}
			})
		} catch (error) {
			logger.error(error)
		}
		return results
	},
}
