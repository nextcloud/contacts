/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createApp } from 'vue'
import ReadOnlyContactDetails from '../views/ReadOnlyContactDetails.vue'
import { createPinia } from 'pinia'

import store from '../store/index.js'
import LegacyGlobalMixin from '../mixins/LegacyGlobalMixin.js'

/**
 * @param {HTMLElement} el
 * @param {string} contactEmailAddress
 * @return {Promise<object>}
 */
export function mountContactDetails(el, contactEmailAddress) {
	const app = createApp(ReadOnlyContactDetails, {
		contactEmailAddress,
	})

	const pinia = createPinia()
	app.use(pinia)
	app.use(store)

	app.mixin(LegacyGlobalMixin)

	return app.mount(el)
}
