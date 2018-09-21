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
	- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	- GNU Affero General Public License for more details.
	-
	- You should have received a copy of the GNU Affero General Public License
	- along with this program. If not, see <http://www.gnu.org/licenses/>.
	-
-->

<template>
	<form id="new-addressbook-form" name="new-addressbook-form" class="new-addressbook"
		@submit.prevent.stop="addAddressbook">
		<input id="new-addressbook" ref="addressbook"
			:placeholder="t('contacts', 'Address book name')"
			class="new-addressbook-input"
			type="text"
			autocomplete="off" autocorrect="off"
			spellcheck="false">
		<input type="submit" value="" class="icon-confirm">
	</form>
</template>

<script>
import clickOutside from 'vue-click-outside'

export default {
	name: 'SettingsNewAddressbook',
	components: {
		clickOutside
	},
	directives: {
		clickOutside
	},
	data() {
		return {
			// TODO: add pattern attribute to input, bind to addressBookRegex property
		}
	},
	computed: {
		menu() {
			return []
		}
	},
	methods: {
		/**
		 * Set new address book name
		 *
		 *
		 */
		addAddressbook() {
			let addressbook = this.$refs.addressbook.value
			this.$store.dispatch('appendAddressbook', { displayName: addressbook })
		}
	}
}
</script>
