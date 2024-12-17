/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import path from 'path'
import { createAppConfig } from '@nextcloud/vite-config'

export default createAppConfig({
	'main': path.join(__dirname, 'src', 'main.js'),
	'files-action': path.join(__dirname, 'src', 'files-action.js'),
	'admin-settings': path.join(__dirname, 'src', 'admin-settings.js'),
	'reference': path.join(__dirname, 'src', 'reference.js'),
}, {
	inlineCSS: false,
})
