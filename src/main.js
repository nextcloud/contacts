/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// eslint-disable-next-line import/no-unresolved, n/no-missing-import
import 'vite/modulepreload-polyfill'

import { sync } from 'vuex-router-sync'
import Vue from 'vue'

import App from './ContactsRoot.vue'
import router from './router/index.js'
import store from './store/index.js'
import logger from './services/logger.js'

/** GLOBAL COMPONENTS AND DIRECTIVE */
import { Tooltip as VTooltip } from '@nextcloud/vue'

// Global scss sheets
import './css/contacts.scss'

// Dialogs css
import '@nextcloud/dialogs/style.css'

import { createPinia, PiniaVuePlugin } from 'pinia'

Vue.use(PiniaVuePlugin)
const pinia = createPinia()

// Register global directives
Vue.directive('Tooltip', VTooltip)

sync(store, router)

Vue.prototype.t = t
Vue.prototype.n = n

Vue.prototype.appName = appName
Vue.prototype.appVersion = appVersion
Vue.prototype.logger = logger
Vue.prototype.OC = window.OC
Vue.prototype.OCA = window.OCA

// enable devtools in development mode
if (import.meta.env.MODE === 'development') {
	Vue.config.devtools = true
}

// Force redirect if rewrite enabled but accessed through index.php
if (window.location.pathname.split('/')[1] === 'index.php'
	&& window.OC.config.modRewriteWorking) {
	router.push({
		name: 'group',
		params: { selectedGroup: t('contacts', 'All contacts') },
	})
}

export default new Vue({
	el: '#content',
	name: 'ContactsApp',
	router,
	store,
	render: h => h(App),
	pinia,
})
