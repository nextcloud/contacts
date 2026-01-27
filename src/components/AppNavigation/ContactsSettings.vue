<!--
  - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppSettingsDialog
		id="app-settings-dialog"
		v-model:open="showSettings"
		:name="t('contacts', 'Contacts settings')"
		:show-navigation="true">
		<AppSettingsSection id="general-settings" :name="t('contacts', 'General settings')">
			<CheckboxRadioSwitch
				:model-value="enableSocialSync"
				:loading="enableSocialSyncLoading"
				:disabled="enableSocialSyncLoading"
				class="social-sync__checkbox contacts-settings-modal__form__row"
				@update:model-value="toggleSocialSync">
				<div class="social-sync__checkbox__label">
					<span>
						{{ t('contacts', 'Update avatars from social media') }}
						<em>{{ t('contacts', '(refreshed once per week)') }}</em>
					</span>
				</div>
			</CheckboxRadioSwitch>
			<SettingsSortContacts class="contacts-settings-modal__form__row" />
		</AppSettingsSection>
		<AppSettingsSection id="address-books" :name="t('contacts', 'Address books')">
			<div class="contacts-settings-modal__form">
				<div class="contacts-settings-modal__form__row">
					<ul id="addressbook-list" class="addressbook-list">
						<SettingsAddressbook v-for="addressbook in addressbooks" :key="addressbook.id" :addressbook="addressbook" />
					</ul>
				</div>
				<SettingsNewAddressbook class="contacts-settings-modal__form__row settings-new-addressbook" :addressbooks="addressbooks" />
				<SettingsImportContacts
					:addressbooks="addressbooks"
					class="contacts-settings-modal__form__row"
					@clicked="onClickImport"
					@file-loaded="onLoad" />
			</div>
		</AppSettingsSection>
	</AppSettingsDialog>
</template>

<script>

import axios from '@nextcloud/axios'
import { loadState } from '@nextcloud/initial-state'
import { generateUrl } from '@nextcloud/router'
import { NcAppSettingsDialog as AppSettingsDialog, NcAppSettingsSection as AppSettingsSection, NcCheckboxRadioSwitch as CheckboxRadioSwitch } from '@nextcloud/vue'
import SettingsAddressbook from './Settings/SettingsAddressbook.vue'
import SettingsImportContacts from './Settings/SettingsImportContacts.vue'
import SettingsNewAddressbook from './Settings/SettingsNewAddressbook.vue'
import SettingsSortContacts from './Settings/SettingsSortContacts.vue'
import { CONTACTS_SETTINGS } from '../../models/constants.ts'

export default {
	name: 'ContactsSettings',
	components: {
		AppSettingsDialog,
		AppSettingsSection,
		SettingsAddressbook,
		SettingsNewAddressbook,
		SettingsImportContacts,
		SettingsSortContacts,
		CheckboxRadioSwitch,
	},

	props: {
		open: {
			required: true,
			type: Boolean,
		},
	},

	data() {
		return {
			CONTACTS_SETTINGS,
			allowSocialSync: loadState('contacts', 'allowSocialSync') !== 'no',
			enableSocialSync: loadState('contacts', 'enableSocialSync') !== 'no',
			enableSocialSyncLoading: false,
			showSettings: false,
		}
	},

	computed: {
		// store getters
		addressbooks() {
			return this.$store.getters.getAddressbooks
		},
	},

	watch: {
		showSettings(value) {
			if (!value) {
				this.$emit('update:open', value)
			}
		},

		async open(value) {
			if (value) {
				await this.onOpen()
			}
		},
	},

	methods: {
		onClickImport(event) {
			this.$emit('clicked', event)
		},

		async toggleSocialSync() {
			this.enableSocialSync = !this.enableSocialSync
			this.enableSocialSyncLoading = true

			// store value
			let setting = 'yes'
			setting = this.allowSocialSync ? 'yes' : 'no'
			try {
				await axios.put(generateUrl('apps/contacts/api/v1/social/config/user/enableSocialSync'), {
					allow: setting,
				})
			} finally {
				this.enableSocialSyncLoading = false
			}
		},

		onLoad() {
			this.$emit('file-loaded', false)
		},

		async onOpen() {
			this.showSettings = true
		},
	},
}
</script>

<style scoped>
>>> .app-settings__title {
	padding: 20px 0;
	margin-bottom: 0;
}

.app-settings-section {
	margin-bottom: 45px;
	padding: 25px 25px 0 25px;
}

.social-sync__checkbox, .settings-new-addressbook  {
	margin-bottom: 20px;
}

.contacts-settings-modal__form__row >>> .material-design-icon {
	justify-content: flex-start;
}

.settings-new-addressbook >>> .new-addressbook-input {
	min-height: 44px;
	height: 44px;
	width: 100%;
}

.settings-new-addressbook >>> .icon-confirm {
	min-height: 44px;
	height: 44px;
	border-color: var(--color-border-dark) !important;
	border-inline-start: none;
}

</style>
