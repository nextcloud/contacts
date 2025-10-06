/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Contact from '../models/contact.js'
import checks from './checks/index.js'

/**
 * @param contact
 */
export default function(contact) {
	let result = false
	if (contact instanceof Contact) {
		// Going through every checks
		checks.forEach((check) => {
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
