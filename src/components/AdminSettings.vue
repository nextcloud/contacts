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
				class="import-button"
				type="primary"
				@click="toggleModal">
				<template #icon>
					<IconUpload :size="20" />
				</template>
				{{ t('contacts', 'Import contact') }}
			</NcButton>
			<NcDialog :open.sync="isModalOpen"
				:name="t('contacts', 'Import contacts')"
				:buttons="buttons">
				<div>
					<p>{{ t('contacts', 'Importing a new .vcf file will delete the existing default contact and replace it with the new one. Do you want to continue?') }}</p>
					<input id="contact-import"
						ref="contact-import-input"
						:disabled="loading"
						type="file"
						class="hidden-visually"
						@change="processFile">
				</div>
			</NcDialog>
		</p>
	</div>
</template>

<script>
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { loadState } from '@nextcloud/initial-state'
import { NcDialog, NcButton } from '@nextcloud/vue'
import { showSuccess } from '@nextcloud/dialogs'
import IconUpload from 'vue-material-design-icons/Upload.vue'
import IconCancel from '@mdi/svg/svg/cancel.svg'
import IconCheck from '@mdi/svg/svg/check.svg'

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
			buttons: [
				{
					label: t('contacts', 'Cancel'),
					icon: IconCancel,
					callback: () => { this.isModalOpen = false },
				},
				{
					label: t('contacts', 'Import'),
					type: 'primary',
					icon: IconCheck,
					callback: () => { this.clickImportInput() },
				},
			],
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

		processFile(event) {
			this.loading = true

			const file = event.target.files[0]
			const reader = new FileReader()

			reader.onload = () => {
				this.isModalOpen = false
				axios.put(generateUrl('/apps/contacts/api/defaultcontact/contact'), { contactData: reader.result })
				event.target.value = ''
			}
			reader.readAsText(file)
			showSuccess(this.t('contacts', 'Contact imported successfully'))
		},
	},
}
</script>
<style lang="scss" scoped>
.import-button {
	margin-top: 1rem;
}
</style>
