/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { translate as t } from '@nextcloud/l10n'

/**
 * Props of a NcCounterBubble showing a number of contacts,
 * suffixed with a plus sign when more contacts remain to be loaded
 *
 * @param {number} count the number of loaded contacts
 * @param {boolean} hasMore whether more contacts remain to be loaded
 * @return {{count: number|string, raw?: boolean}}
 */
export function contactsCounterProps(count, hasMore) {
	if (!hasMore) {
		return { count }
	}
	return {
		count: t('contacts', '{count}+', { count }),
		raw: true,
	}
}
