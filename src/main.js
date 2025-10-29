/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './ContactsRoot.vue'
import LegacyGlobalMixin from './mixins/LegacyGlobalMixin.js'
import router from './router/index.js'
import logger from './services/logger.js'
import store from './store/index.js'

import 'vite/modulepreload-polyfill'
// Global scss sheets
import './css/contacts.scss'
// Dialogs css
import '@nextcloud/dialogs/style.css'

const app = createApp(App)

// Redirect Vue errors to Sentry
app.config.errorHandler = async function(error, vm, info) {
	logger.error(`[Vue error]: Error in ${info}: ${error}`, {
		error,
		vm,
		info,
	})
	window.onerror?.(error)
}

const pinia = createPinia()
app.use(pinia)

app.use(store)
app.use(router)

app.mixin(LegacyGlobalMixin)

// Force redirect if rewrite enabled but accessed through index.php
if (window.location.pathname.split('/')[1] === 'index.php'
	&& window.OC.config.modRewriteWorking) {
	router.push({
		name: 'group',
		params: { selectedGroup: t('contacts', 'All contacts') },
	})
}

app.mount('#content')
