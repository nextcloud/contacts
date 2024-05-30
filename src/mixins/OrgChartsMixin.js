/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { otherContacts } from '../utils/chartUtils.js'

export default {
	methods: {
		// The current component root
		otherContacts(self) {
			return otherContacts({
				$store: this.$store,
				self,
			})
		},
	},
}
