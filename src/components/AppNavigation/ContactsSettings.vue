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
		<AppSettingsSection id="general" :name="t('contacts', 'General')">
			<SettingsSortContacts />

			<NcFormBox>
				<NcFormBoxSwitch
					v-model="enableSocialSync"
					:label="t('contacts', 'Update avatars from social media')"
					:description="t('contacts', 'Refreshed once per week')"
					:loading="enableSocialSyncLoading"
					:disabled="enableSocialSyncLoading"
					@update:model-value="toggleSocialSync" />
			</NcFormBox>

			<SettingsImportContacts
				:addressbooks="addressbooks"
				@clicked="onClickImport"
				@file-loaded="onLoad" />
		</AppSettingsSection>

		<AppSettingsSection id="address-books" :name="t('contacts', 'Address books')">
			<ul id="addressbook-list" class="addressbook-list">
				<SettingsAddressbook v-for="addressbook in addressbooks" :key="addressbook.id" :addressbook="addressbook" />
			</ul>
			<SettingsNewAddressbook class="settings-new-addressbook" :addressbooks="addressbooks" />
		</AppSettingsSection>
	</AppSettingsDialog>
</template>

<script>

import axios from '@nextcloud/axios'
import { showError, showSuccess } from '@nextcloud/dialogs'
import { loadState } from '@nextcloud/initial-state'
import { generateUrl } from '@nextcloud/router'
import {
	NcAppSettingsDialog as AppSettingsDialog,
	NcAppSettingsSection as AppSettingsSection,
} from '@nextcloud/vue'
import NcFormBox from '@nextcloud/vue/components/NcFormBox'
import NcFormBoxSwitch from '@nextcloud/vue/components/NcFormBoxSwitch'
import SettingsAddressbook from './Settings/SettingsAddressbook.vue'
import SettingsImportContacts from './Settings/SettingsImportContacts.vue'
import SettingsNewAddressbook from './Settings/SettingsNewAddressbook.vue'
import SettingsSortContacts from './Settings/SettingsSortContacts.vue'

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

		async toggleSocialSync(value) {
			this.enableSocialSyncLoading = true

			const setting = value ? 'yes' : 'no'
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
