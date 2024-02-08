/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// eslint-disable-next-line import/no-unresolved, n/no-missing-import
import 'vite/modulepreload-polyfill'

import ConfirmationDialog from './components/ConfirmationDialog.vue'

import { generateUrl } from '@nextcloud/router'
import { translate as t } from '@nextcloud/l10n'
import { DefaultType, FileAction, Permission, registerFileAction } from '@nextcloud/files'
/* eslint-disable-next-line import/no-unresolved */
import ContactSvg from '@mdi/svg/svg/account-multiple.svg?raw'
import Vue from 'vue'

Vue.prototype.t = t

const mime = 'text/vcard'
const name = 'contacts-import'
const nextcloudVersionIsGreaterThanOr28 = parseInt(window.OC.config.version.split('.')[0]) >= 28

if (nextcloudVersionIsGreaterThanOr28) {
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
			let dialog
			try {
				// Open the confirmation dialog
				const containerId = 'confirmation-' + Math.random().toString(16).slice(2)
				const container = document.createElement('div')
				container.id = containerId
				document.body.appendChild(container)
				await new Promise((resolve, reject) => {
					const ImportConfirmationDialog = Vue.extend(ConfirmationDialog)
					dialog = new ImportConfirmationDialog({
						propsData: {
							title: t('contacts', 'Are you sure you want to import this contact file?'),
							resolve,
							reject,
						},
					})
					dialog.$mount(`#${containerId}`)
				})

				// Redirect to the import page if the user confirmed
				window.location = generateUrl(`/apps/contacts/import?file=${file.path}`)
			} catch (e) {
				// Do nothing if the user cancels
			}

			// Destroy confirmation modal (div element is removed from the DOM by vue)
			dialog.$destroy()
		},
	}))
} else {
	window.addEventListener('DOMContentLoaded', () => {
		if (window.OCA.Files && window.OCA.Files.fileActions) {
			window.OCA.Files.fileActions.registerAction({
				name,
				displayName: t('contacts', 'Import'),
				mime,
				permissions: window.OC.PERMISSION_READ,
				iconClass: 'icon-contacts-dark',
				actionHandler(fileName, context) {
					const absPath = `${context.dir === '/' ? '' : context.dir}/${fileName}`
					window.location = generateUrl(`/apps/contacts/import?file=${absPath}`)
				},
			})
			window.OCA.Files.fileActions.setDefault(mime, name)
			return
		}
		console.error('Unable to register vcf import action')
	})
}
