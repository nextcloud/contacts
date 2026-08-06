/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/l10n', () => ({
	translate: (app, text) => text,
	translatePlural: (app, text) => text,
}))

jest.mock('@nextcloud/initial-state', () => ({
	loadState: (app, key, fallback) => fallback,
}))

jest.mock('@nextcloud/cdav-library', () => ({
	__esModule: true,
	default: jest.fn(),
	namespaces: {},
}))

jest.mock('@nextcloud/axios', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
	},
}), { virtual: true })

// jsdom does not provide these globals, but Node does
const { TextDecoder, TextEncoder } = require('util')
global.TextEncoder = global.TextEncoder ?? TextEncoder
global.TextDecoder = global.TextDecoder ?? TextDecoder

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
