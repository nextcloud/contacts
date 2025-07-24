/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useIsMobile } from '@nextcloud/vue'

export default {
	computed: {
		isMobile() {
			return useIsMobile().value
		},
	},
}
