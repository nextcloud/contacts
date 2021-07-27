<!--
	- @copyright Copyright (c) 2018 Team Popcorn <teampopcornberlin@gmail.com>
	-
	- @author Team Popcorn <teampopcornberlin@gmail.com>
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
	<div class="new-addressbook-entry">
		<div class="icon-add settings-line__icon"></div>
		<form id="new-addressbook-form"
			:disabled="loading"
			:class="{'icon-loading-small': loading}"
			name="new-addressbook-form"
			class="new-addressbook"
			@submit.prevent.stop="addAddressbook">
			<input id="new-addressbook"
				ref="addressbook"
				v-model="displayName"
				:disabled="loading"
				:placeholder="t('contacts', 'Add new address book')"
				:pattern="addressBookRegex"
				class="new-addressbook-input"
				type="text"
				autocomplete="off"
				autocorrect="off"
				spellcheck="false"
				minlength="1"
				required>
			<input class="icon-confirm" type="submit" value="">
		</form>
	</div>
</template>

<script>
import { showError } from '@nextcloud/dialogs'

export default {
	name: 'SettingsNewAddressbook',

	data() {
		return {
			loading: false,
			displayName: '',
			// no slashes!
			// eslint-disable-next-line
			addressBookRegex: '[^/\\\\]+'
		}
	},
	methods: {
		/**
		 * Add a new address book
		 */
		addAddressbook() {
			this.loading = true
			this.$store.dispatch('appendAddressbook', { displayName: this.displayName })
				.then(() => {
					this.displayName = ''
					this.loading = false
				})
				.catch((error) => {
					console.error(error)
					showError(t('contacts', 'An error occurred, unable to create the address book'))
					this.loading = false
				})
		},
	},
}
</script>
