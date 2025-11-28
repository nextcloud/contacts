/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createApp } from 'vue'
import JoinPage from './components/Invitation/JoinPage.vue'
import LegacyGlobalMixin from './mixins/LegacyGlobalMixin.js'

import 'vite/modulepreload-polyfill'

document.addEventListener('DOMContentLoaded', main)

function main() {
	const app = createApp(JoinPage)
	app.mixin(LegacyGlobalMixin)
	app.mount('#join-page')
}
