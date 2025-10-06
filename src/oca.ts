/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import ReadOnlyContactDetails from './views/ReadOnlyContactDetails.vue'
import LegacyGlobalMixin from './mixins/LegacyGlobalMixin.js'
import store from './store/index.js'

import 'vite/modulepreload-polyfill'
// Global scss sheets
import './css/contacts.scss'
// Dialogs css
import '@nextcloud/dialogs/style.css'

declare global {
	interface Window {
		OCA: {
			Contacts?: {
				/**
				 * Mount the contact details component at the given DOM element.
				 *
				 * @param el Html element to mount the component at.
				 * @param contactEmailAddress Email address of the contact whose details to display.
				 * @return Component handle with a basic API to control it.
				 */
				mountContactDetails(
					el: HTMLElement,
					contactEmailAddress: string,
				): Promise<{ $destroy(): void }>
			}
		}
	}
}

window.OCA ??= {}
window.OCA.Contacts = {
	async mountContactDetails(el, contactEmailAddress) {
		const app = createApp(ReadOnlyContactDetails, {
			contactEmailAddress,
		})

		const pinia = createPinia()
		app.use(pinia)
		app.use(store)

		app.mixin(LegacyGlobalMixin)

		app.mount(el)

		return {
			$destroy: () => app.unmount(),
		}
	},
}
