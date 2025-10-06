/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { n, t } from '@nextcloud/l10n'
import logger from '../services/logger.js'

/**
 * Mixin for translations and legacy stuff.
 */
export default {
	methods: {
		t,
		n,
	},

	computed: {
		appName: () => appName,
		appVersion: () => appVersion,
		logger: () => logger,
		OC: () => window.OC,
		OCA: () => window.OCA,
	},
}
