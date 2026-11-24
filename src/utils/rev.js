/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Read the REV of a vCard
 *
 * @param {object} vCard the ical.js vCard component
 * @return {object|null} the revision time, or null if missing or not a usable time
 */
export function readRev(vCard) {
	const property = vCard.getFirstProperty('rev')
	if (!property) {
		return null
	}

	let rev
	try {
		rev = property.getFirstValue()
	} catch {
		return null
	}

	// text values decode to strings, and an empty value to a time without a date
	if (typeof rev?.toUnixTime !== 'function' || rev.year === null || rev.month === null || rev.day === null) {
		return null
	}
	return rev
}

/**
 * Set the REV of a vCard
 *
 * The property is recreated so that ical.js serializes the value with the
 * default type of the vCard version, and the value is given as a string to
 * keep the seconds: a REV without seconds is invalid in vCard 3.0 and gets
 * mangled by other clients.
 *
 * @param {object} vCard the ical.js vCard component
 * @param {Date} [date] the revision time
 */
export function writeRev(vCard, date = new Date()) {
	vCard.removeAllProperties('rev')
	vCard.addPropertyWithValue('rev', date.toISOString().replace(/\.\d{3}Z$/, 'Z'))
}
