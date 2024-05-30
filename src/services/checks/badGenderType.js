/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
