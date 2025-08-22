/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

module.exports = {
	ignorePatterns: ['src/**/*.d.ts'],
	globals: {
		appName: true,
		appVersion: true,
	},
	extends: [
		'@nextcloud/eslint-config/vue3',
	],
	rules: {
		// @nextcloud/vue has Button, Content components restricted by rule
		'vue/no-reserved-component-names': 'off',
	},
}
