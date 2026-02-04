/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createApp } from 'vue'
import JoinInvitation from './components/JoinInvitation.vue'
import LegacyGlobalMixin from './mixins/LegacyGlobalMixin.js'

import 'vite/modulepreload-polyfill'

document.addEventListener('DOMContentLoaded', main)

function main() {
	const app = createApp(JoinInvitation)
	app.mixin(LegacyGlobalMixin)
	app.mount('#join-invitation')
}
