/*
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
	 * @memberof Contact
	 */
	constructor(vcard = '') {
		let jCal = ICAL.parse(vcard)
		if (jCal[0] !== 'vcard') {
			throw new Error('Only one contact is allowed in the vcard data')
		}

		this.vCard = new ICAL.Component(jCal)

		// if no uid set, create one
		if (!this.vCard.hasProperty('uid')) {
			console.debug('This contact did not have a proper uid. Setting a new one for ', this)
			this.vCard.addPropertyWithValue('uid', uuid())
		}
	}

	/**
	 *	Return the uid
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get uid() {
		return this.vCard.getFirstPropertyValue('uid')
	}

	/**
	 *	Return the first email
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get email() {
		return this.vCard.getFirstPropertyValue('email')
	}

	/**
	 *	Return the display name
	 *
	 * @readonly
	 * @memberof Contact
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

}
