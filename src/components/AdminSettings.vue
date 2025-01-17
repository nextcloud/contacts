<!--
  - SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div id="contacts" class="section">
		<h2>{{ t('contacts', 'Contacts') }}</h2>
		<p>
			<input id="allow-social-sync"
				v-model="allowSocialSync"
				type="checkbox"
				class="checkbox"
				@change="updateAllowSocialSync">
			<label for="allow-social-sync">{{ t('contacts', 'Allow updating avatars from social media') }}</label>
		</p>
		<p>
			<input id="enable-default-contact"
				v-model="enableDefaultContact"
				type="checkbox"
				class="checkbox"
				@change="updateEnableDefaultContact">
			<label for="enable-default-contact"> {{ t('mail',"Default contact is added to the user's own address book on user's first login.") }} </label>
			<NcButton v-if="enableDefaultContact"
				type="primary"
				@click="toggleModal">
				<template #icon>
					<IconUpload :size="20" />
				</template>
				{{ t('contacts', 'Import contact') }}
			</NcButton>
			<NcDialog v-if="isModalOpen"
				ref="modal"
				class="import-contact__modal"
				:name="t('contacts', 'Import contacts')"
				@close="toggleModal">
				<section class="import-contact__modal-pick">
					<input id="contact-import"
						ref="contact-import-input"
						:disabled="loading"
						type="file"
						class="hidden-visually"
						@change="processFile">
					<NcButton :disabled="loading"
						@click="clickImportInput">
						<template #icon>
							<IconUpload :size="20" />
						</template>
						{{ t('contacts', 'Select local file') }}
					</NcButton>
				</section>
			</NcDialog>
		</p>
	</div>
</template>

<script>
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { loadState } from '@nextcloud/initial-state'
import { NcDialog, NcButton } from '@nextcloud/vue'
import Contact from '../models/contact.js'
import validate from '../services/validate.js'
import { showError, showSuccess } from '@nextcloud/dialogs'
import IconUpload from 'vue-material-design-icons/Upload.vue'

export default {
	name: 'AdminSettings',
	components: {
		NcDialog,
		NcButton,
		IconUpload,
	},
	data() {
		return {
			allowSocialSync: loadState('contacts', 'allowSocialSync') === 'yes',
			enableDefaultContact: loadState('contacts', 'enableDefaultContact') === 'yes',
			isModalOpen: false,
			loading: false,
		}
	},
	methods: {
		updateAllowSocialSync() {
			axios.put(generateUrl('apps/contacts/api/v1/social/config/global/allowSocialSync'), {
				allow: this.allowSocialSync ? 'yes' : 'no',
			})
		},
		updateEnableDefaultContact() {
			axios.put(generateUrl('apps/contacts/api/defaultcontact/config'), {
				allow: this.enableDefaultContact ? 'yes' : 'no',
			})
		},
		toggleModal() {
			this.isModalOpen = !this.isModalOpen
		},
		clickImportInput() {
			this.$refs['contact-import-input'].click()
		},

		/**
		 * Process input type file change
		 *
		 * @param {Event} event the input change event
		 */
		 processFile(event) {
			this.loading = true

			const file = event.target.files[0]
			const reader = new FileReader()

			reader.onload = () => {
				this.isModalOpen = false
				const contact = new Contact(reader.result)
				/* if (!validate(contact)) {
					showError(t('contacts', 'Invalid VCF file'))
					event.target.value = ''
					return
				} */
				axios.put(generateUrl('/apps/contacts/api/defaultcontact/contact'), { contactData: reader.result })
				event.target.value = ''
			}
			reader.readAsText(file)
			showSuccess(this.t('contacts', 'Contact imported successfully'))
		},
	},
}
</script>
