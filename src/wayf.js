/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { loadState } from '@nextcloud/initial-state'
import { translatePlural as n, translate as t } from '@nextcloud/l10n'
import { createApp } from 'vue'
import Wayf from './components/Ocm/Wayf.vue'

import './css/wayf.scss'

const mountWayf = () => {
	const props = loadState('contacts', 'wayf')
	const app = createApp(Wayf, props)
	app.config.globalProperties.t = t
	app.config.globalProperties.n = n
	app.mount('#contacts-wayf')
}

if (!document.body.id) {
	document.body.id = 'body-public'
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', mountWayf)
} else {
	mountWayf()
}
