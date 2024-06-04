/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Vue from 'vue'
import AdminSettings from './components/AdminSettings.vue'

document.addEventListener('DOMContentLoaded', main)

/**
 *
 */
function main() {
	Vue.prototype.t = t

	const View = Vue.extend(AdminSettings)
	const view = new View()
	view.$mount('#contacts-settings')
}
