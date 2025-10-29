/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import ContactSvg from '@mdi/svg/svg/account-multiple.svg?raw'
import { DefaultType, FileAction, Permission, registerFileAction } from '@nextcloud/files'
import { translate as t } from '@nextcloud/l10n'
import { generateUrl } from '@nextcloud/router'
import { createApp } from 'vue'
import ConfirmationDialog from './components/ConfirmationDialog.vue'
import LegacyGlobalMixin from './mixins/LegacyGlobalMixin.js'

import 'vite/modulepreload-polyfill'

const mime = 'text/vcard'
const name = 'contacts-import'

registerFileAction(new FileAction({
	id: name,
	displayName: () => t('contacts', 'Import'),
	default: DefaultType.DEFAULT,
	enabled: (nodes) => {
		if (nodes.length !== 1) {
			return false
		}
		const node = nodes[0]
		return node.mime === mime && (node.permissions & Permission.READ)
	},
	iconSvgInline: () => ContactSvg,
	async exec(file) {
		let app
		try {
			// Open the confirmation dialog
			const containerId = 'confirmation-' + Math.random().toString(16).slice(2)
			const container = document.createElement('div')
			container.id = containerId
			document.body.appendChild(container)
			await new Promise((resolve, reject) => {
				app = createApp(ConfirmationDialog, {
					title: t('contacts', 'Are you sure you want to import this contact file?'),
					resolve,
					reject,
				})
				app.mixin(LegacyGlobalMixin)
				app.mount(`#${containerId}`)
			})

			// Redirect to the import page if the user confirmed
			window.location = generateUrl(`/apps/contacts/import?file=${file.path}`)
		} catch (e) {
			// Do nothing if the user cancels
		} finally {
			// Destroy confirmation modal (div element is removed from the DOM by vue)
			app?.unmount()
		}

		// No toast should be shown -> indicate "unknown" action state
		return null
	},
}))
