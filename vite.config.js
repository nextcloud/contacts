/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createAppConfig } from '@nextcloud/vite-config'
import path from 'path'
import { defineConfig } from 'vite'

export default createAppConfig({
	'main': path.join(__dirname, 'src', 'main.js'),
	'files-action': path.join(__dirname, 'src', 'files-action.js'),
	'admin-settings': path.join(__dirname, 'src', 'admin-settings.js'),
	'oca': path.join(__dirname, 'src', 'oca.ts'),
	'wayf': path.join(__dirname, 'src', 'wayf.js'),
}, {
	inlineCSS: false,
	config: defineConfig(({ mode }) => ({
		define: {
			'process.env.NODE_ENV': JSON.stringify(mode),
		},
	})),
})
