/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Vue from 'vue'
import ReadOnlyContactDetails from '../views/ReadOnlyContactDetails.vue'
import { createPinia, PiniaVuePlugin } from 'pinia'

/** GLOBAL COMPONENTS AND DIRECTIVE */
import { Tooltip as VTooltip } from '@nextcloud/vue'

import store from '../store/index.js'
import logger from '../services/logger.js'

/**
 * @param {HTMLElement} el
 * @param {string} contactEmailAddress
 * @return {Promise<object>}
 */
export function mountContactDetails(el, contactEmailAddress) {
	Vue.use(PiniaVuePlugin)
	const pinia = createPinia()

	// Register global directives
	Vue.directive('Tooltip', VTooltip)

	Vue.prototype.t = t
	Vue.prototype.n = n

	Vue.prototype.appName = appName
	Vue.prototype.appVersion = appVersion
	Vue.prototype.logger = logger
	Vue.prototype.OC = window.OC
	Vue.prototype.OCA = window.OCA

	const Component = Vue.extend(ReadOnlyContactDetails)
	const vueElement = new Component({
		pinia,
		store,
		propsData: {
			contactEmailAddress,
		},
	}).$mount(el)
	return vueElement
}
