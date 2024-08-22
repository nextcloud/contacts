/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { defineStore } from 'pinia'

export default defineStore('principals', {
	state: () => ({
		currentUserPrincipal: null,
	}),
	actions: {
		setCurrentUserPrincipal(client) {
			this.currentUserPrincipal = client?.currentUserPrincipal
		},
	},
})
