/**
 * @copyright Copyright (c) 2020 Christian Kraus <hanzi@hanzi.cc>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 * @author Christian Kraus <hanzi@hanzi.cc>
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
import ICAL from 'ical.js'

/**
 * Fixes nextcloud/contacts#1009 that prevented editing of contacts if
 * their address contained a comma. This is actually a bug in ical.js
 * but it has not been fixed for some time now.
 *
 * This can be removed once https://github.com/mozilla-comm/ical.js/issues/386
 * has been resolved.
 *
 * @returns {Boolean} Whether or not the design set has been altered.
 */
const setLabelAsSingleValue = () => {
	if (
		!ICAL.design.vcard.param.label
		|| ICAL.design.vcard.param.label.multiValue !== false
		|| !ICAL.design.vcard3.param.label
		|| ICAL.design.vcard3.param.label.multiValue !== false
	) {
		ICAL.design.vcard.param.label = { multiValue: false }
		ICAL.design.vcard3.param.label = { multiValue: false }

		return true
	}

	return false
}

/**
 * Prevents ical.js from adding 'VALUE=PHONE-NUMBER' in vCard 3.0.
 * While not wrong according to the RFC, there's a bug in sabreio/vobject (used
 * by Nextcloud Server) that prevents saving vCards with this parameters.
 *
 * @link https://github.com/nextcloud/contacts/pull/1393#issuecomment-570945735
 *
 * @returns {Boolean} Whether or not the design set has been altered.
 */
const removePhoneNumberValueType = () => {
	if (ICAL.design.vcard3.property.tel) {
		delete ICAL.design.vcard3.property.tel
		return true
	}

	return false
}

/**
 * Some clients group properties by naming them something like 'ITEM1.URL'.
 * These should be treated the same as their original (i.e. 'URL' in this
 * example), so we iterate through the vCard to find these properties and
 * add them to the ical.js design set.
 *
 * @link https://github.com/nextcloud/contacts/issues/42
 *
 * @param {Array} vCard The ical.js vCard
 * @returns {Boolean} Whether or not the design set has been altered.
 */
const addGroupedProperties = vCard => {
	let madeChanges = false
	vCard[1].forEach(prop => {
		const propGroup = prop[0].split('.')

		// if this is a grouped property, update the designSet
		if (propGroup.length === 2) {
			madeChanges = setPropertyAlias(propGroup[1], prop[0])
		}
	})
	return madeChanges
}

/**
 * Check whether the ical.js design sets need updating (and if so, do it)
 *
 * @param {Array} vCard The ical.js vCard
 * @returns {boolean} Whether or not the design set has been altered.
 */
export default function(vCard) {
	let madeChanges = false

	madeChanges |= setLabelAsSingleValue()
	madeChanges |= removePhoneNumberValueType()
	madeChanges |= addGroupedProperties(vCard)

	return madeChanges
}

/**
 * @param {String} original Name of the property whose settings should be copied
 * @param {String} alias Name of the new property
 * @returns {boolean} Whether or not the design set has been altered.
 */
export function setPropertyAlias(original, alias) {
	let madeChanges = false
	original = original.toLowerCase()
	alias = alias.toLowerCase()

	if (ICAL.design.vcard.property[original]) {
		ICAL.design.vcard.property[alias] = ICAL.design.vcard.property[original]
		madeChanges = true
	}

	if (ICAL.design.vcard3.property[original]) {
		ICAL.design.vcard3.property[alias] = ICAL.design.vcard3.property[original]
		madeChanges = true
	}

	return madeChanges
}
