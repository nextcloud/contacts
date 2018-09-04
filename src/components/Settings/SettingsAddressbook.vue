<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
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
	<div>
		<li v-if="editingName" class="new-addressbook">
			<form id="new-addressbook-form" name="new-addressbook-form"
				class="new-addressbook__form" addressbooks="[object Object]"
				@submit.prevent="updateAddressbookName">
				<!-- rename addressbook input -->
				<input :placeholder="addressbook.displayName"
					v-model="newName" type="text">
				<input type="submit" value=""
					class="new-addressbook__submit inline-button icon-confirm action pull-right">
			</form>
		</li>
		<li v-else :class="{'disabled': !addressbook.enabled}" class="addressbook">
			<!-- addressbook name -->
			<span class="addressbook__name">{{ addressbook.displayName }}</span>
			<!-- sharing button -->
			<a href="#" class="addressbook__share icon-shared"
				@click="toggleShare" />
			<!-- popovermenu -->
			<a v-click-outside="closeMenu" href="#" class="addressbook__menu"
				@click="toggleMenu">
				<div class="icon-more" />
				<div :class="{'open': menuOpen}" class="popovermenu">
					<popover-menu :menu="menu" />
				</div>
			</a>
		</li>
		<!-- sharing input -->
		<share-address-book v-if="shareOpen" :addressbook="addressbook" />
	</div>
</template>

<script>
import popoverMenu from '../core/popoverMenu'
import shareAddressBook from './SettingsAddressbookShare'
import renameAddressBookField from './SettingsRenameAddressbookField'

import clickOutside from 'vue-click-outside'

export default {
	name: 'SettingsAddressbook',
	components: {
		popoverMenu,
		shareAddressBook,
		renameAddressBookField,
		clickOutside
	},
	directives: {
		clickOutside
	},
	props: {
		addressbook: {
			type: Object,
			default() {
				return {}
			}
		}
	},
	data() {
		return {
			menuOpen: false,
			shareOpen: false,
			editingName: false,
			newName: this.addressbook.displayName // new name for addressbook
		}
	},
	computed: {
		enabled() {
			return this.addressbook.enabled
		},
		// building the popover menu
		menu() {
			return [{
				href: '/remote.php/dav/addressbooks/users/admin/Contacts/',
				icon: 'icon-public',
				text: t('settings', 'Copy link'),
				action: ''
			},
			{
				href: '/remote.php/dav/addressbooks/users/admin/Contacts/?export',
				icon: 'icon-download',
				text: t('settings', 'Download'),
				action: ''
			},
			{
				icon: 'icon-rename',
				text: t('settings', 'Rename'),
				action: this.renameAddressbook
			},
			{
				icon: 'checkbox',
				text: this.enabled ? t('settings', 'Enabled') : t('settings', 'Disabled'),
				input: 'checkbox',
				model: this.enabled,
				action: this.toggleAddressbookEnabled
			},
			{
				icon: 'icon-delete',
				text: t('settings', 'Delete'),
				action: this.deleteAddressbook
			}]
		}
	},
	mounted() {
		// required if popup needs to stay opened after menu click
		this.popupItem = this.$el
	},
	methods: {
		toggleAddressbookEnabled() {
			this.$store.dispatch('toggleAddressbookEnabled', this.addressbook)
		},
		deleteAddressbook() {
			this.$store.dispatch('deleteAddressbook', this.addressbook)
		},
		toggleShare() {
			this.shareOpen = !this.shareOpen
		},
		closeMenu() {
			this.menuOpen = false
		},
		toggleMenu() {
			this.menuOpen = !this.menuOpen
		},
		renameAddressbook() {
			this.editingName = true
		},
		updateAddressbookName() {
			let addressbook = this.addressbook
			let newName = this.newName
			this.$store.dispatch('renameAddressbook', { addressbook, newName }).then(this.editingName = false)
		}
	}
}
</script>
