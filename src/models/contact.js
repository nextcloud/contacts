/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import uuid from 'uuid'
import ICAL from 'ical.js'

export default class Contact {

	/**
	 * Creates an instance of Contact
	 *
	 * @param {string} [vcard] the vcard data as string with proper new lines
	 * @param {object} [addressbook] the addressbook which the contat belongs to
	 * @memberof Contact
	 */
	constructor(vcard = '', addressbook) {
		let jCal = ICAL.parse(vcard)
		if (jCal[0] !== 'vcard') {
			throw new Error('Only one contact is allowed in the vcard data')
		}

		this.jCal = jCal
		this.addressbook = addressbook
		this.vCard = new ICAL.Component(this.jCal)

		// if no uid set, create one
		if (!this.vCard.hasProperty('uid')) {
			console.debug('This contact did not have a proper uid. Setting a new one for ', this)
			this.vCard.addPropertyWithValue('uid', uuid())
		}
	}

	/**
	 * Ensure we're normalizing the possible arrays
	 * into a string by taking the first element
	 * e.g. ORG:ABC\, Inc.; will output an array because of the semi-colon
	 *
	 * @param {Array|string} data
	 * @returns string
	 * @memberof Contact
	 */
	firstIfArray(data) {
		return Array.isArray(data) ? data[0] : data
	}

	/**
	 * Return the uid
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get uid() {
		return this.vCard.getFirstPropertyValue('uid')
	}

	/**
	 * Set the uid
	 *
	 * @memberof Contact
	 */
	set uid(uid) {
		this.vCard.updatePropertyWithValue('uid', uid)
		return true
	}

	/**
	 * Return the key
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get key() {
		return this.uid + '@' + this.addressbook.id
	}

	/**
	 * Return the groups
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get groups() {
		let prop = this.vCard.getFirstProperty('categories')
		if (prop) {
			return this.vCard.getFirstProperty('categories').getValues()
		}
		return []
	}

	/**
	 * Return the groups
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get kind() {
		return this.firstIfArray(this.vCard.getFirstPropertyValue('kind'))
	}

	/**
	 * Return the first email
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get email() {
		return this.firstIfArray(this.vCard.getFirstPropertyValue('email'))
	}

	/**
	 * Return the first email
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get org() {
		return this.firstIfArray(this.vCard.getFirstPropertyValue('org'))
	}

	/**
	 * Return the first email
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get title() {
		return this.firstIfArray(this.vCard.getFirstPropertyValue('title'))
	}

	/**
	 * Return the first email
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get fullName() {
		return this.vCard.getFirstPropertyValue('fn')
	}

	/**
	 * Return the display name
	 *
	 * @readonly
	 * @memberof Contact
	 * @returns {string} the displayName
	 */
	get displayName() {
		if (this.vCard.hasProperty('fn')) {
			return this.vCard.getFirstPropertyValue('fn')
		}
		if (this.vCard.hasProperty('n')) {
			// reverse and join
			return this.vCard.getFirstPropertyValue('n').filter(function(part) {
				return part
			}).join(' ')
		}
		return null
	}

	/**
	 * Return the first name if exists
	 * Returns the displayName otherwise
	 *
	 * @readonly
	 * @memberof Contact
	 * @returns {string} firstName|displayName
	 */
	get firstName() {
		if (this.vCard.hasProperty('n')) {
			// reverse and join
			return this.vCard.getFirstPropertyValue('n')[1]
		}
		return this.displayName
	}

	/**
	 * Return the last name if exists
	 * Returns the displayName otherwise
	 *
	 * @readonly
	 * @memberof Contact
	 * @returns {string} lastName|displayName
	 */
	get lastName() {
		if (this.vCard.hasProperty('n')) {
			// reverse and join
			return this.vCard.getFirstPropertyValue('n')[0]
		}
		return this.displayName
	}

}
