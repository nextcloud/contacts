/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Organization, then email, then phone: the order used before it was configurable.
 * Keep in sync with SubtitleOrderService::DEFAULT_ORDER.
 */
export const DEFAULT_SUBTITLE_ORDER = ['org', 'email', 'tel']

const fieldValues = {
	org: (contact) => contact.org,
	email: (contact) => contact.email,
	tel: (contact) => contact.properties.find((property) => property.name === 'tel')?.getFirstValue(),
}

/**
 * Pick the line shown under a contact's name in the contacts list:
 * the first field in the given order that the contact has
 *
 * @param {object} contact the contact
 * @param {string[]} order the fields to try, out of org, email and tel
 * @return {string} the field's value, or an empty string if the contact has none of them
 */
export function pickSubtitle(contact, order = DEFAULT_SUBTITLE_ORDER) {
	for (const field of order) {
		const value = fieldValues[field]?.(contact)
		if (value) {
			return value
		}
	}
	return ''
}
