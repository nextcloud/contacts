<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Matthias Heinisch <nextcloud@matthiasheinisch.de>
  -
  - @license GNU AGPL version 3 or any later version
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
	<div>
		<SettingsSortContacts class="settings-section" />
		<CheckboxRadioSwitch :checked="enableSocialSync"
			:loading="enableSocialSyncLoading"
			:disabled="enableSocialSyncLoading"
			class="social-sync__checkbox"
			@update:checked="toggleSocialSync">
			<div class="social-sync__checkbox__label">
				<span>
					{{ t('contacts', 'Update avatars from social media') }}
					<em>{{ t('contacts', '(refreshed once per week)') }}</em>
				</span>
			</div>
		</CheckboxRadioSwitch>
		<div class="settings-addressbook-list__header">
			<span>{{ t('contacts', 'Address books') }}</span>
		</div>
		<ul id="addressbook-list">
			<SettingsAddressbook v-for="addressbook in addressbooks" :key="addressbook.id" :addressbook="addressbook" />
		</ul>
		<SettingsNewAddressbook :addressbooks="addressbooks" />
		<SettingsImportContacts :addressbooks="addressbooks"
			class="settings-section"
			@clicked="onClickImport"
			@file-loaded="onLoad" />
	</div>
</template>

<script>
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { loadState } from '@nextcloud/initial-state'
import SettingsAddressbook from './Settings/SettingsAddressbook'
import SettingsNewAddressbook from './Settings/SettingsNewAddressbook'
import SettingsImportContacts from './Settings/SettingsImportContacts'
import SettingsSortContacts from './Settings/SettingsSortContacts'
import CheckboxRadioSwitch from '@nextcloud/vue/dist/Components/CheckboxRadioSwitch'

export default {
	name: 'SettingsSection',
	components: {
		SettingsAddressbook,
		SettingsNewAddressbook,
		SettingsImportContacts,
		SettingsSortContacts,
		CheckboxRadioSwitch,
	},
	data() {
		return {
			allowSocialSync: loadState('contacts', 'allowSocialSync') !== 'no',
			enableSocialSync: loadState('contacts', 'enableSocialSync') !== 'no',
			enableSocialSyncLoading: false,
		}
	},
	computed: {
		// store getters
		addressbooks() {
			return this.$store.getters.getAddressbooks
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
	},
}
</script>

<style lang="scss" scoped>
.social-sync__checkbox {
	margin-top: 5px;

	::v-deep .checkbox-radio-switch__label {
		height: unset !important;
	}

	::v-deep .checkbox-radio-switch__icon {
		width: 44px;
		flex-shrink: 0;
		flex-grow: 0;
	}
}
</style>
