<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
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
		<ul id="addressbook-list">
			<SettingsAddressbook v-for="addressbook in addressbooks" :key="addressbook.id" :addressbook="addressbook" />
		</ul>
		<SettingsNewAddressbook :addressbooks="addressbooks" />
		<SettingsSortContacts class="settings-section" />
		<SettingsImportContacts :addressbooks="addressbooks"
			class="settings-section"
			@clicked="onClickImport"
			@fileLoaded="onLoad" />
	</div>
</template>

<script>
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
		onLoad(event) {
			this.$emit('fileLoaded', false)
		},
	},
}
</script>
