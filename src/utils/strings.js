/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getLocale } from '@nextcloud/l10n'

const compareFn = Intl.Collator(getLocale(), { numeric: true }).compare

/**
 * Sort strings accordingly current locale and natural sorting
 *
 * @param {string} a the first string to compare
 * @param {string} b the second string to compare
 * @return {int} 0 if strings are equal, < 0 if a comes before, > 0 if b comes before
 */
export function sortStrings(a, b) {
	return compareFn(a, b)
}
