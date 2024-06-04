/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { showError, showSuccess } from '@nextcloud/dialogs'

export default {
	data() {
		return {
			copied: false,
			copyLoading: false,
			copySuccess: false,
		}
	},
	computed: {
		copyLinkIcon() {
			if (this.copySuccess) {
				return 'icon-checkmark'
			}
			if (this.copyLoading) {
				return 'icon-loading-small'
			}
			return 'icon-public'
		},
	},

	methods: {
		async copyToClipboard(url) {
			// change to loading status
			this.copyLoading = true

			// copy link to clipboard
			try {
				await navigator.clipboard.writeText(url)
				this.copySuccess = true
				this.copied = true

				// Notify success
				showSuccess(t('contacts', 'Link copied to the clipboard'))
			} catch (error) {
				this.copySuccess = false
				this.copied = true
				showError(t('contacts', 'Could not copy link to the clipboard.'))
			} finally {
				this.copyLoading = false
				setTimeout(() => {
					// stop loading status regardless of outcome
					this.copied = false
					this.copySuccess = false
				}, 2000)
			}
		},
	},
}
