/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable vue/match-component-file-name */
import { generateFilePath } from '@nextcloud/router'
import { getRequestToken } from '@nextcloud/auth'
import { sync } from 'vuex-router-sync'
import Vue from 'vue'

import App from './ContactsRoot.vue'
import router from './router/index.js'
import store from './store/index.js'
import logger from './services/logger.js'

/** GLOBAL COMPONENTS AND DIRECTIVE */
import ClickOutside from 'vue-click-outside'
import { Tooltip as VTooltip } from '@nextcloud/vue'

// Global scss sheets
import '../css/contacts.scss'

// Dialogs css
import '@nextcloud/dialogs/style.css'

import { createPinia, PiniaVuePlugin } from 'pinia'

// CSP config for webpack dynamic chunk loading
// eslint-disable-next-line
__webpack_nonce__ = btoa(getRequestToken())

// Correct the root of the app for chunk loading
// OC.linkTo matches the apps folders
// OC.generateUrl ensure the index.php (or not)
// We do not want the index.php since we're loading files
// eslint-disable-next-line
__webpack_public_path__ = generateFilePath('contacts', '', 'js/')

Vue.use(PiniaVuePlugin)
const pinia = createPinia()

// Register global directives
Vue.directive('ClickOutside', ClickOutside)
Vue.directive('Tooltip', VTooltip)

sync(store, router)

Vue.prototype.t = t
Vue.prototype.n = n

Vue.prototype.appName = appName
Vue.prototype.appVersion = appVersion
Vue.prototype.logger = logger
Vue.prototype.OC = OC
Vue.prototype.OCA = OCA

// Force redirect if rewrite enabled but accessed through index.php
if (window.location.pathname.split('/')[1] === 'index.php'
	&& OC.config.modRewriteWorking) {
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
