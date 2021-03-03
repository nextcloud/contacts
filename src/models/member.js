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

import { v4 as uuid } from 'uuid'
import ICAL from 'ical.js'
import b64toBlob from 'b64-to-blob'

export default class Member {

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

		if (updateDesignSet(jCal)) {
			jCal = ICAL.parse(vcard)
		}

		this.jCal = jCal
		this.addressbook = addressbook
		this.vCard = new ICAL.Component(this.jCal)

		// used to state a contact is not up to date with
		// the server and cannot be pushed (etag)
		this.conflict = false

		// if no uid set, create one
		if (!this.vCard.hasProperty('uid')) {
			console.info('This contact did not have a proper uid. Setting a new one for ', this)
			this.vCard.addPropertyWithValue('uid', uuid())
		}

		// if no rev set, init one
		if (!this.vCard.hasProperty('rev')) {
			const rev = new ICAL.VCardTime(null, null, 'date-time')
			rev.fromUnixTime(Date.now() / 1000)
			this.vCard.addPropertyWithValue('rev', rev)

		}
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
	 * Return the version
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get version() {
		return this.vCard.getFirstPropertyValue('version')
	}

	/**
	 * Set the version
	 *
	 * @param {string} version the version to set
	 * @memberof Contact
	 */
	set version(version) {
		this.vCard.updatePropertyWithValue('version', version)
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
	}

	/**
	 * Return the rev
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get rev() {
		return this.vCard.getFirstPropertyValue('rev')
	}

	/**
	 * Set the rev
	 *
	 * @param {string} rev the rev to set
	 * @memberof Contact
	 */
	set rev(rev) {
		this.vCard.updatePropertyWithValue('rev', rev)
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
	}

	/**
	 * Return the photo usable url
	 * We cannot fetch external url because of csp policies
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get photoUrl() {
		const photo = this.vCard.getFirstProperty('photo')
		const encoding = photo.getFirstParameter('encoding')
		let photoType = photo.getFirstParameter('type')
		let photoB64 = this.photo

		const isBinary = photo.type === 'binary' || encoding === 'b'

		if (photo && photoB64.startsWith('data') && !isBinary) {
			// get the last part = base64
			photoB64 = photoB64.split(',').pop()
			// 'data:image/png' => 'png'
			photoType = photoB64.split(';')[0].split('/')
		}

		try {
			// Create blob from url
			const blob = b64toBlob(photoB64, `image/${photoType}`)
			return URL.createObjectURL(blob)
		} catch {
			console.error('Invalid photo for the following contact. Ignoring...', this.contact, { photoB64, photoType })
			return false
		}
	}

	/**
	 * Return the groups
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get groups() {
		const groupsProp = this.vCard.getFirstProperty('categories')
		if (groupsProp) {
			return groupsProp.getValues()
				.filter(group => typeof group === 'string')
				.filter(group => group.trim() !== '')
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
		// delete the title if empty
		if (isEmpty(groups)) {
			this.vCard.removeProperty('categories')
			return
		}

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
		// delete the org if empty
		if (isEmpty(org)) {
			this.vCard.removeProperty('org')
			return
		}
		this.vCard.updatePropertyWithValue('org', org)
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
		// delete the title if empty
		if (isEmpty(title)) {
			this.vCard.removeProperty('title')
			return
		}
		this.vCard.updatePropertyWithValue('title', title)
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
		this.vCard.updatePropertyWithValue('fn', name)
	}

	/**
	 * Formatted display name based on the order key
	 *
	 * @readonly
	 * @memberof Contact
	 */
	get displayName() {
		const orderKey = store.getters.getOrderKey
		const n = this.vCard.getFirstPropertyValue('n')
		const fn = this.vCard.getFirstPropertyValue('fn')
		const org = this.vCard.getFirstPropertyValue('org')

		// if ordered by last or first name we need the N property
		// ! by checking the property we check for null AND empty string
		// ! that means we can then check for empty array and be safe not to have
		// ! 'xxxx'.join('') !== ''
		if (orderKey && n && !isEmpty(n)) {
			switch (orderKey) {
			case 'firstName':
				// Stevenson;John;Philip,Paul;Dr.;Jr.,M.D.,A.C.P.
				// -> John Stevenson
				if (isEmpty(n[0])) {
					return n[1]
				}
				return n.slice(0, 2).reverse().join(' ')

			case 'lastName':
				// Stevenson;John;Philip,Paul;Dr.;Jr.,M.D.,A.C.P.
				// -> Stevenson, John
				if (isEmpty(n[0])) {
					return n[1]
				}
				return n.slice(0, 2).join(', ')
			}
		}
		// otherwise the FN is enough
		if (fn) {
			return fn
		}
		// BUT if no FN property use the N anyway
		if (n && !isEmpty(n)) {
			// Stevenson;John;Philip,Paul;Dr.;Jr.,M.D.,A.C.P.
			// -> John Stevenson
			if (isEmpty(n[0])) {
				return n[1]
			}
			return n.slice(0, 2).reverse().join(' ')
		}
		// LAST chance, use the org ir that's the only thing we have
		if (org && !isEmpty(org)) {
			// org is supposed to be an array but is also used as plain string
			return Array.isArray(org) ? org[0] : org
		}
		return ''

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
	 * Return the phonetic first name if exists
	 * Returns the first name or displayName otherwise
	 *
	 * @readonly
	 * @memberof Contact
	 * @returns {string} phoneticFirstName|firstName|displayName
	 */
	get phoneticFirstName() {
		if (this.vCard.hasProperty('x-phonetic-first-name')) {
			return this.vCard.getFirstPropertyValue('x-phonetic-first-name')
		}
		return this.firstName
	}

	/**
	 * Return the phonetic last name if exists
	 * Returns the displayName otherwise
	 *
	 * @readonly
	 * @memberof Contact
	 * @returns {string} lastName|displayName
	 */
	get phoneticLastName() {
		if (this.vCard.hasProperty('x-phonetic-last-name')) {
			return this.vCard.getFirstPropertyValue('x-phonetic-last-name')
		}
		return this.lastName
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
