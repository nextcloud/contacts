/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Contact from '../models/contact.js'
import checks from './checks/index.js'
import logger from './logger.js'

/**
 * Run all repair checks on a contact and apply fixes when needed.
 *
 * @param {Contact} contact the contact to validate
 * @return {boolean} true if a non-silent fix was applied
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
						logger.warn('The following contact needed a correction that failed:', { name: check.name, contact })
					} else {
						// SUCCESS 💪
						// Only display visual feedback if the fix is not silent
						if (!check.silent) {
							result = true
						}
						logger.info('The following contact has been repaired:', { name: check.name, contact })
					}
				}
			} catch (error) {
				logger.error('Error during the check:', { name: check.name, contact, error })
			}
		})
		return result
	} else {
		throw new Error('Invalid contact provided')
	}
}
