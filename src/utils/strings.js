/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import naturalCompare from 'string-natural-compare'

/**
 * Sort strings stripping diacritics and using natural sorting
 *
 * @param {string} a the first string to compare
 * @param {string} b the second string to compare
 * @return {int} 0 if strings are equal, < 0 if a comes before, > 0 if b comes before
 */
export function sortStrings(a, b) {
	const flatA = a.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	const flatB = b.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	return naturalCompare(flatA, flatB, { caseInsensitive: true })
}
