/**
 * @copyright Copyright (c) 2020 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 * @author Richard Steinmetz <richard@steinmetz.cloud>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
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
const nextcloudVersionIsGreaterThanOr28 = parseInt(OC.config.version.split('.')[0]) >= 28

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
		if (OCA.Files && OCA.Files.fileActions) {
			OCA.Files.fileActions.registerAction({
				name,
				displayName: t('contacts', 'Import'),
				mime,
				permissions: OC.PERMISSION_READ,
				iconClass: 'icon-contacts-dark',
				actionHandler(fileName, context) {
					const absPath = `${context.dir === '/' ? '' : context.dir}/${fileName}`
					window.location = generateUrl(`/apps/contacts/import?file=${absPath}`)
				},
			})
			OCA.Files.fileActions.setDefault(mime, name)
			return
		}
		console.error('Unable to register vcf import action')
	})
}
