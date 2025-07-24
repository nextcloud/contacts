/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// eslint-disable-next-line import/no-unresolved, n/no-missing-import
import 'vite/modulepreload-polyfill'

import { createApp } from 'vue'

import App from './ContactsRoot.vue'
import router from './router/index.js'
import store from './store/index.js'
import LegacyGlobalMixin from './mixins/LegacyGlobalMixin.js'

// Global scss sheets
import './css/contacts.scss'

// Dialogs css
import '@nextcloud/dialogs/style.css'

import { createPinia } from 'pinia'

const app = createApp(App)

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
