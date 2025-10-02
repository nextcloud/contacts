/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * the FN field is mandatory. If there is none we need to
 * create it based on the available data
 */
export default {
	name: 'missing FN',
	run: (contact) => {
		return !contact.vCard.hasProperty('fn') // No FN
			|| contact.vCard.getFirstPropertyValue('fn') === '' // Empty FN
			|| ( // we don't want to fix newly created contacts
				contact.dav // Existing contact
				&& contact.vCard.getFirstPropertyValue('fn')
					.toLowerCase() === t('contacts', 'New contact').toLowerCase() // AND Unchanged FN
			)
	},
	fix: (contact) => {
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
