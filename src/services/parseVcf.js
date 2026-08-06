/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Contact from '../models/contact.js'
import Store from '../store/index.js'
import logger from './logger.js'

/**
 * Parse a vcf data string, add them to the store
 * and return a list of contacts
 *
 * @param {string} data The vcf data
 * @param {object} addressbook the addressbook to add to
 * @return {Contact[]}
 */
export default function parseVcf(data, addressbook) {
	const regexp = /BEGIN:VCARD[\s\S]*?END:VCARD/mgi
	const vCards = data.match(regexp)

	if (!vCards) {
		logger.error('Error during the parsing of the following vcf file', { data })
		return []
	}

	if (!addressbook) {
		logger.error('Invalid addressbook', { addressbook })
		return []
	}

	Store.dispatch('setTotal', vCards.length)

	// Not using map because we want to only push valid contacts
	// map force to return at least undefined
	return vCards.reduce((contacts, vCard) => {
		try {
			const contact = new Contact(vCard, addressbook)
			contacts.push(contact)
		} catch (e) {
			// Parse error! Do not stop here...
			Store.dispatch('incrementDenied')
			logger.error(e)
		}
		return contacts
	}, [])
}
