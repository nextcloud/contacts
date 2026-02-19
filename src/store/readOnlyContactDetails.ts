/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { defineStore } from 'pinia'
import client from '../services/cdav.js'
import store from './index.js'
import usePrincipalsStore from './principals.js'

export default defineStore('readOnlyContactDetails', {
	state: () => ({
		promise: null,
		fetched: false,
	}),

	actions: {
		async init() {
			if (this.fetched) {
				return Promise.resolve()
			}

			if (this.promise) {
				return this.promise
			}

			this.promise = (async () => {
				await client.connect({ enableCardDAV: true })
				const principalsStore = usePrincipalsStore()
				principalsStore.setCurrentUserPrincipal(client)
				await store.dispatch('getAddressbooks')
			})()

			try {
				await this.promise
				this.fetched = true
			} finally {
				this.promise = null
			}

			return this.promise
		},
	},
})
