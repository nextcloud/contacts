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
			<form id="new-addressbook-form" name="new-addressbook-form" class="new-addressbook__form"
				@submit.prevent="updateAddressbookName">
				<!-- rename addressbook input -->
				<input :placeholder="addressbook.displayName"
					v-model="newName" type="text">
				<input type="submit" value=""
					class="new-addressbook__submit icon-confirm">
			</form>
		</li>
		<li v-else :class="{disabled: !addressbook.enabled}" class="addressbook">
			<!-- addressbook name -->
			<span class="addressbook__name">{{ addressbook.displayName }}</span>
			<!-- sharing button -->
			<a href="#" class="addressbook__share icon-shared"
				@click="toggleShare" />
			<!-- popovermenu -->
			<a v-click-outside="closeMenu" href="#" class="addressbook__menu">
				<div class="icon-more" @click="toggleMenu" />
				<div :class="{open: menuOpen}" class="popovermenu">
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

import VueClipboard from 'vue-clipboard2'
import clickOutside from 'vue-click-outside'

export default {
	name: 'SettingsAddressbook',
	components: {
		popoverMenu,
		shareAddressBook,
		renameAddressBookField
	},
	directives: {
		clickOutside,
		VueClipboard
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
			copied: false,
			copySuccess: true,
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
				href: '#',
				icon: 'icon-public',
				text: !this.copied ? t('contacts', 'Copy link') : this.copySuccess ? t('contacts', 'Copied') : t('contacts', 'Can not copy'),
				action: this.copyLink
			},
			{
				href: this.addressbook.url + '?export',
				icon: 'icon-download',
				text: t('contacts', 'Download'),
				action: ''
			},
			{
				icon: 'icon-rename',
				text: t('contacts', 'Rename'),
				action: this.renameAddressbook
			},
			{
				icon: 'checkbox',
				text: this.enabled ? t('contacts', 'Enabled') : t('contacts', 'Disabled'),
				input: 'checkbox',
				model: this.enabled,
				action: this.toggleAddressbookEnabled
			}]
		}
	},
	mounted() {
		// required if popup needs to stay opened after menu click
		this.popupItem = this.$el
	},
	methods: {
		closeMenu() {
			this.menuOpen = false
		},
		toggleMenu() {
			this.menuOpen = !this.menuOpen
		},
		toggleShare() {
			this.shareOpen = !this.shareOpen
		},
		toggleAddressbookEnabled() {
			this.$store.dispatch('toggleAddressbookEnabled', this.addressbook)
		},
		deleteAddressbook() {
			this.$store.dispatch('deleteAddressbook', this.addressbook)
		},
		renameAddressbook() {
			this.editingName = true
		},
		updateAddressbookName() {
			let addressbook = this.addressbook
			let newName = this.newName
			this.$store.dispatch('renameAddressbook', { addressbook, newName }).then(this.editingName = false)
		},
		copyLink() {
			// copy link for addressbook to clipboard
			this.copySuccess = true
			this.copied = true
			this.$copyText(this.addressbook.url).then(e => {
				this.copySuccess = true
				this.copied = true
			}, e => {
				this.copySuccess = false
				this.copied = true

			})
			setTimeout(function() { 
				console.log('copied')
				this.copied = false 
			}, 500)
		}
	}
}
</script>
