/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// eslint-disable-next-line import/no-unresolved, n/no-missing-import
import 'vite/modulepreload-polyfill'

// Global scss sheets
import './css/contacts.scss'

// Dialogs css
import '@nextcloud/dialogs/style.css'

import { mountContactDetails } from './oca/mountContactDetails.js'

window.OCA ??= {}
window.OCA.Contacts = {
	/**
	 * @param {HTMLElement} el Html element to mount the component at
	 * @param {string} contactEmailAddress Email address of the contact whose details to display
	 * @return {Promise<object>} Mounted Vue instance (vm)
	 */
	async mountContactDetails(el, contactEmailAddress) {
		return mountContactDetails(el, contactEmailAddress)
	},
}
