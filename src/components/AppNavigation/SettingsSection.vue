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
		<div v-if="allowSocialSync" class="social-sync__list-entry">
			<input
				id="socialSyncToggle"
				class="checkbox"
				:checked="enableSocialSync"
				type="checkbox"
				@change="toggleSocialSync">
			<label for="socialSyncToggle">{{ t('contacts', 'Update avatars from social media') }}</label>
			<em for="socialSyncToggle">{{ t('contacts', '(refreshed once per week)') }}</em>
		</div>
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

export default {
	name: 'SettingsSection',
	components: {
		SettingsAddressbook,
		SettingsNewAddressbook,
		SettingsImportContacts,
		SettingsSortContacts,
	},
	data() {
		return {
			allowSocialSync: loadState('contacts', 'allowSocialSync') !== 'no',
			enableSocialSync: loadState('contacts', 'enableSocialSync') !== 'no',
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
		toggleSocialSync() {
			this.enableSocialSync = !this.enableSocialSync

			// store value
			let setting = 'yes'
			this.enableSocialSync ? setting = 'yes' : setting = 'no'
			axios.put(generateUrl('apps/contacts/api/v1/social/config/user/enableSocialSync'), {
				allow: setting,
			})
		},
		onLoad(event) {
			this.$emit('file-loaded', false)
		},
	},
}
</script>
