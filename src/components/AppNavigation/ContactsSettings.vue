<!--
  - @copyright Copyright (c) 2022 Julia Kirschenheuter <julia.kirschenheuter@nextcloud.com>
  - @copyright Copyright (c) 2022 Informatyka Boguslawski sp. z o.o. sp.k., http://www.ib.pl/
  -
  - @author Julia Kirschenheuter <julia.kirschenheuter@nextcloud.com>
  -
  - @license AGPL-3.0-or-later
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<AppSettingsDialog id="app-settings-dialog"
		:title="t('contacts', 'Contacts settings')"
		:show-navigation="true"
		:open.sync="showSettings">
		<AppSettingsSection id="general-settings" :title="t('contacts', 'General settings')">
			<CheckboxRadioSwitch v-if="allowSocialSync"
				:checked="enableSocialSync"
				:loading="enableSocialSyncLoading"
				:disabled="enableSocialSyncLoading"
				class="social-sync__checkbox contacts-settings-modal__form__row"
				@update:checked="toggleSocialSync">
				<div class="social-sync__checkbox__label">
					<span>
						{{ t('contacts', 'Update avatars from social media') }}
						<em>{{ t('contacts', '(refreshed once per week)') }}</em>
					</span>
				</div>
			</CheckboxRadioSwitch>
			<SettingsSortContacts class="contacts-settings-modal__form__row" />
		</AppSettingsSection>
		<AppSettingsSection id="address-books" :title="t('contacts', 'Address books')">
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
import CheckboxRadioSwitch from '@nextcloud/vue/dist/Components/NcCheckboxRadioSwitch.js'
import { CONTACTS_SETTINGS } from '../../models/constants.ts'
import { NcAppSettingsDialog as AppSettingsDialog, NcAppSettingsSection as AppSettingsSection } from '@nextcloud/vue'

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
			this.enableSocialSync ? setting = 'yes' : setting = 'no'
			try {
				await axios.put(generateUrl('apps/contacts/api/v1/social/config/user/enableSocialSync'), {
					allow: setting,
				})
			} finally {
				this.enableSocialSyncLoading = false
			}
		},
		onLoad(event) {
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
	border-left: none;
}

</style>
