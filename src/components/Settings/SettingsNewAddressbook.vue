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
		<input id="new-addressbook" ref="addressbook" class="new-addressbook-input"
			placeholder="Address book name"
			:pattern="addressBookRegex"			
			type="text"
			autocomplete="off" autocorrect="off"
			spellcheck="false"
			tooltip-enable="!newAddressbookForm.$pristine"
			tooltip-trigger="none"
			tooltip-placement="top"
			uib-tooltip="Only these special characters are allowed: -_.!?#|()">
		<input type="submit" value="" class="newAddressbookSubmit inline-button icon-confirm action pull-right">
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
			addressBookRegex: new RegExp("/^[a-zA-Z0-9À-ÿ\s_.!?#|()-]+$/i")
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
		 * @param {string} addressbook The address book name provided in the input
		 *
		 */
		addAddressbook() {
			let addressbook = this.$refs.addressbook.value
			this.$store.dispatch('appendAddressbook', { displayName: addressbook })
		}
	}
}
</script>
