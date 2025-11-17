<!--
  - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppSettingsDialog id="app-settings-dialog"
		v-model:open="showSettings"
		:name="t('contacts', 'Contacts settings')"
		:show-navigation="true">
		<AppSettingsSection id="general-settings" :name="t('contacts', 'General settings')">
			<CheckboxRadioSwitch :model-value="enableSocialSync"
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
				<SettingsImportContacts :addressbooks="addressbooks"
					class="contacts-settings-modal__form__row"
					@clicked="onClickImport"
					@file-loaded="onLoad" />
			</div>
		</AppSettingsSection>
	</AppSettingsDialog>
</template>

<script>

import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { loadState } from '@nextcloud/initial-state'
import SettingsAddressbook from './Settings/SettingsAddressbook.vue'
import SettingsNewAddressbook from './Settings/SettingsNewAddressbook.vue'
import SettingsImportContacts from './Settings/SettingsImportContacts.vue'
import SettingsSortContacts from './Settings/SettingsSortContacts.vue'
import { NcCheckboxRadioSwitch as CheckboxRadioSwitch, NcAppSettingsDialog as AppSettingsDialog, NcAppSettingsSection as AppSettingsSection } from '@nextcloud/vue'
import { CONTACTS_SETTINGS } from '../../models/constants.ts'

export default {
	name: 'ContactsSettings',
	components: {
		AppSettingsDialog,
		AppSettingsSection,
		NcFormBox,
		NcFormBoxSwitch,
		SettingsAddressbook,
		SettingsNewAddressbook,
		SettingsImportContacts,
		SettingsSortContacts,
	},
	props: {
		open: {
			required: true,
			type: Boolean,
		},
	},
	data() {
		return {
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
			this.enableSocialSync ? setting = 'yes' : setting = 'no'
			try {
				await axios.put(generateUrl('apps/contacts/api/v1/social/config/user/enableSocialSync'), {
					allow: setting,
				})
				showSuccess(t('contacts', 'Setting saved'))
			} catch {
				showError(t('contacts', 'Failed to save setting'))
				this.enableSocialSync = !value
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

<style lang="scss" scoped>
.addressbook-list {
	list-style: none;
	padding: 0;
	margin: 0 0 calc(var(--default-grid-baseline) * 2);

	:deep(.settings-addressbook-list) {
		display: flex;
		align-items: center;
		gap: calc(var(--default-grid-baseline) * 2);
		padding: calc(var(--default-grid-baseline) * 2) 0;
		border-bottom: 1px solid var(--color-border);

		&:last-child {
			border-bottom: none;
		}

		.settings-line__icon {
			flex-shrink: 0;
			width: 44px;
			height: 44px;
		}

		.addressbook {
			flex: 1;
			padding: 0;
		}
	}
}
</style>
