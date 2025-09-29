/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import usePrincipalsStore from '../store/principals.js'

/**
 * Sorts addressbooks into groups with the following priority:
 *  1. First group: My addressbooks
 *  2. Second group: Shared with me and writeable
 *  3. Third group: Read-only
 *
 *  Withing each group, addressbooks are sorted by the number of contacts, from highest to lowest
 *
 * @param {Array} addressbooks
 * @return {Array}
 */
export function sortAddressbooks(addressbooks) {
	return addressbooks
		.slice()
		.sort((a, b) => {
			const getContactCount = (ab) => Object.keys(ab.contacts || {}).length

			const groupA = getPriorityGroup(a)
			const groupB = getPriorityGroup(b)

			// First, sort by priority group
			if (groupA !== groupB) {
				return groupA - groupB
			}

			// If not sort by contact count
			const countA = getContactCount(a)
			const countB = getContactCount(b)

			if (countA !== countB) {
				return countB - countA
			}

			// If contact counts are equal, sort alphabetically by ID as tiebreaker
			return a.id.localeCompare(b.id)
		})
}

/**
 *
 * @param ab
 */
function getPriorityGroup(ab) {
	const principalsStore = usePrincipalsStore()

	if (ab.readOnly) {
		return 3
	}
	if (ab.owner !== principalsStore.currentUserPrincipal.url) {
		return 2
	}
	return 1
}
