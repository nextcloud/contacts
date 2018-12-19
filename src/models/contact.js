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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
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
	 * @param {string} vcard the vcard data as string with proper new lines
	 * @param {object} addressbook the addressbook which the contat belongs to
	 * @memberof Contact
	 */
	constructor(vcard, addressbook) {
		if (typeof vcard !== 'string' || vcard.length === 0) {
			throw new Error('Invalid vCard')
		}

		let jCal = ICAL.parse(vcard)
		if (jCal[0] !== 'vcard') {
			throw new Error('Only one contact is allowed in the vcard data')
		}

		this.jCal = jCal
		this.addressbook = addressbook
		this.vCard = new ICAL.Component(this.jCal)

		// used to state a contact is not up to date with
		// the server and cannot be pushed (etag)
		this.conflict = false

		// if no uid set, create one
		if (!this.vCard.hasProperty('uid')) {
			console.debug('This contact did not have a proper uid. Setting a new one for ', this)
			this.vCard.addPropertyWithValue('uid', uuid())
		}
	}

	/**
	 * Update internal data of this contact
	 *
	 * @param {jCal} jCal jCal object from ICAL.js
	 * @memberof Contact
	 */
	updateContact(jCal) {
		this.jCal = jCal
		this.vCard = new ICAL.Component(this.jCal)
	}

	/**
	 * Update linked addressbook of this contact
	 *
	 * @param {Object} addressbook the addressbook
	 * @memberof Contact
	 */
	updateAddressbook(addressbook) {
		this.addressbook = addressbook
	}

	/**
	 * Ensure we're normalizing the possible arrays
	 * into a string by taking the first element
	 * e.g. ORG:ABC\, Inc.; will output an array because of the semi-colon
	 *
	 * @param {Array|string} data the data to normalize
	 * @returns {string}
	 * @memberof Contact
	 */
	firstIfArray(data) {
		return Array.isArray(data) ? data[0] : data
	}

	/**
	 * Return the url
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get url() {
		if (this.dav) {
			return this.dav.url
		}
		return ''
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
	 * @param {string} uid the uid to set
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
		return this.uid + '~' + this.addressbook.id
	}

	/**
	 * Return the photo
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get photo() {
		return this.vCard.getFirstPropertyValue('photo')
	}

	/**
	 * Set the photo
	 *
	 * @param {string} photo the photo to set
	 * @memberof Contact
	 */
	set photo(photo) {
		this.vCard.updatePropertyWithValue('photo', photo)
		return true
	}

	/**
	 * Return the groups
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get groups() {
		let groupsProp = this.vCard.getFirstProperty('categories')
		if (groupsProp) {
			return groupsProp.getValues()
				.filter(group => group !== '')
		}
		return []
	}

	/**
	 * Set the groups
	 *
	 * @param {Array} groups the groups to set
	 * @memberof Contact
	 */
	set groups(groups) {
		if (Array.isArray(groups)) {
			let property = this.vCard.getFirstProperty('categories')
			if (!property) {
				// Init with empty group since we set everything afterwise
				property = this.vCard.addPropertyWithValue('categories', '')
			}
			property.setValues(groups)
		} else {
			throw new Error('groups data is not an Array')
		}
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
	 * Return the first org
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get org() {
		return this.firstIfArray(this.vCard.getFirstPropertyValue('org'))
	}

	/**
	 * Set the org
	 *
	 * @param {string} org the org data
	 * @memberof Contact
	 */
	set org(org) {
		return this.vCard.updatePropertyWithValue('org', org)
	}

	/**
	 * Return the first title
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get title() {
		return this.firstIfArray(this.vCard.getFirstPropertyValue('title'))
	}

	/**
	 * Set the title
	 *
	 * @param {string} title the title
	 * @memberof Contact
	 */
	set title(title) {
		return this.vCard.updatePropertyWithValue('title', title)
	}

	/**
	 * Return the full name
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get fullName() {
		return this.vCard.getFirstPropertyValue('fn')
	}

	/**
	 * Set the full name
	 *
	 * @param {string} name the fn data
	 * @memberof Contact
	 */
	set fullName(name) {
		return this.vCard.updatePropertyWithValue('fn', name)
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
			return this.vCard.getFirstPropertyValue('n')
				.filter(function(part) {
					return part
				})
				.join(' ')
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

	/**
	 * Return all the properties as Property objects
	 *
	 * @readonly
	 * @memberof Contact
	 * @returns {Property[]} http://mozilla-comm.github.io/ical.js/api/ICAL.Property.html
	 */
	get properties() {
		return this.vCard.getAllProperties()
	}

	/**
	 * Return an array of formatted properties for the search
	 *
	 * @readonly
	 * @memberof Contact
	 * @returns {string[]}
	 */
	get searchData() {
		return this.jCal[1].map(x => x[0] + ':' + x[3])
	}

	/**
	 * Add the contact to the group
	 *
	 * @param {string} group the group to add the contact to
	 * @memberof Contact
	 */
	addToGroup(group) {
		if (this.groups.indexOf(group) === -1) {
			if (this.groups.length > 0) {
				this.vCard.getFirstProperty('categories').setValues(this.groups.concat(group))
			} else {
				this.vCard.updatePropertyWithValue('categories', [group])
			}
		}
	}

}
