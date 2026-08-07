/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

interface ContactListEntry {
	key: string
}

/**
 * Return the key of the previous contact in the list, or null if already at the first.
 *
 * @param filteredList Ordered array of contact objects with a `key` property
 * @param selectedKey Key of the currently selected contact
 */
export function getPreviousContactKey(filteredList: ContactListEntry[], selectedKey: string): string | null {
	const currentIndex = filteredList.findIndex((c) => c.key === selectedKey)
	if (currentIndex > 0) {
		return filteredList[currentIndex - 1].key
	}
	return null
}

/**
 * Return the key of the next contact in the list, or null if already at the last.
 *
 * @param filteredList Ordered array of contact objects with a `key` property
 * @param selectedKey Key of the currently selected contact
 */
export function getNextContactKey(filteredList: ContactListEntry[], selectedKey: string): string | null {
	const currentIndex = filteredList.findIndex((c) => c.key === selectedKey)
	if (currentIndex !== -1 && currentIndex < filteredList.length - 1) {
		return filteredList[currentIndex + 1].key
	}
	return null
}
