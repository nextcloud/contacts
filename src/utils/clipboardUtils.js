/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { showError, showSuccess } from '@nextcloud/dialogs'

async function copyValueToClipboard(value) {
	try {
		await navigator.clipboard.writeText(value)
		showSuccess(t('contacts', 'Value copied to the clipboard'))
	} catch (error) {
		showError(t('contacts', 'Could not copy value to the clipboard.'))
	}
}

export { copyValueToClipboard }
