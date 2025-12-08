/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
// eslint-disable-next-line node/no-extraneous-import
import 'regenerator-runtime/runtime'

if (typeof structuredClone === 'undefined') {
	global.structuredClone = (val) => JSON.parse(JSON.stringify(val))
}
import Vue from 'vue'

jest.mock('@nextcloud/l10n', () => ({
	translate: (app, text) => text,
	translatePlural: (app, text) => text,
}))

jest.mock('@nextcloud/initial-state', () => ({
	loadState: (app, key, fallback) => fallback,
}))

global.appName = 'contacts'

global.OC = {
	requestToken: '123',
	webroot: '/nc-webroot',
	coreApps: [
		'core',
	],
	config: {
		modRewriteWorking: true,
	},
	dialogs: {
	},
	isUserAdmin() {
		return true
	},
	getLanguage() {
		return 'en-GB'
	},
	getLocale() {
		return 'en_GB'
	},

	MimeType: {
		getIconUrl: jest.fn(),
	},
}

global.OCA = {}
global.OCP = {}

// TODO: use nextcloud-l10n lib once https://github.com/nextcloud/nextcloud-l10n/issues/271 is solved
global.t = jest.fn().mockImplementation((app, text) => text)
global.n = jest.fn().mockImplementation((app, text) => text)

Vue.prototype.t = global.t
Vue.prototype.n = global.n
Vue.prototype.OC = OC
Vue.prototype.OCA = OCA
