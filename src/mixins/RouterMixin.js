/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
export default {
	computed: {
		// router variables
		selectedContact() {
			return this.$route.params.selectedContact
		},
		selectedGroup() {
			return this.$route.params.selectedGroup
		},
		selectedCircle() {
			return this.$route.params.selectedCircle
		},
		selectedChart() {
			return this.$route.params.selectedChart
		},
	},
}
