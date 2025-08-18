/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { translate, translatePlural } from '@nextcloud/l10n'
import Vue from 'vue'
import DashboardTeamsWidget from './components/Dashboard/DashboardTeamsWidget.vue'
import logger from './services/logger.js'

Vue.prototype.t = translate
Vue.prototype.n = translatePlural

logger.debug('Teams widget script loaded')

window.addEventListener('DOMContentLoaded', () => {
	logger.debug('Registering teams widget with dashboard')
	
	window.OCA.Dashboard.register('circles', (el) => {
		logger.debug('Mounting teams widget to element', { element: el })
		
		global.CirclesTeamsWidget = new Vue({
			el,
			render: (h) => h(DashboardTeamsWidget),
		})
	})
})