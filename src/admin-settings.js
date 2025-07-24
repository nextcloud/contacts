/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// eslint-disable-next-line import/no-unresolved, n/no-missing-import
import 'vite/modulepreload-polyfill'

import { createApp } from 'vue'
import AdminSettings from './components/AdminSettings.vue'
import LegacyGlobalMixin from './mixins/LegacyGlobalMixin.js'

document.addEventListener('DOMContentLoaded', main)

/**
 *
 */
function main() {
	const app = createApp(AdminSettings)
	app.mixin(LegacyGlobalMixin)
	app.mount('#contacts-settings')
}
