/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export default {
	props: {
		// The current component root
		component: {
			type: Object,
			default: () => {},
			required: true,
		},
	},
}
