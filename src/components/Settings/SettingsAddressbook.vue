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
		<li :class="{disabled: !addressbook.enabled}" class="addressbook">
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
import Vue from 'vue'
import popoverMenu from '../core/popoverMenu'
import shareAddressBook from './SettingsAddressbookShare'
import renameAddressBookField from './SettingsRenameAddressbookField'
import clickOutside from 'vue-click-outside'
import VueClipboard from 'vue-clipboard2'

Vue.use(VueClipboard)

export default {
	name: 'SettingsAddressbook',
	components: {
		popoverMenu,
		shareAddressBook,
		renameAddressBookField
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
			copied: false,
			copySuccess: true
		}
	},
	computed: {
		enabled() {
			return this.addressbook.enabled
		},
		newName() {
			return this.addressbook.displayName // new name for addressbook
		},
		// building the popover menu
		menu() {
			let menu =
				[{
					href: this.addressbook.url,
					icon: 'icon-public',
					text: !this.copied
						? t('contacts', 'Copy link')
						: this.copySuccess
							? t('contacts', 'Copied')
							: t('contacts', 'Can not copy'),
					action: this.copyLink
				},
				{
					href: this.addressbook.url + '?export',
					icon: 'icon-download',
					text: t('contacts', 'Download'),
					action: null
				},
				{
					icon: 'icon-rename',
					// check if editing name
					input: this.editingName ? 'text' : null,
					text: !this.editingName ? t('contacts', 'Rename') : '',
					action: !this.editingName ? this.renameAddressbook : this.updateAddressbookName,
					model: this.newName,
					placeholder: this.addressbook.displayName
				},
				{
					text: this.enabled ? t('contacts', 'Enabled') : t('contacts', 'Disabled'),
					input: 'checkbox',
					key: 'enableAddressbook',
					model: this.enabled,
					action: this.toggleAddressbookEnabled
				}]
			// check to ensure last addressbook is not deleted.
			if (this.$store.getters.getAddressbooks.length > 1) {
				menu.push({
					icon: 'icon-delete',
					text: t('contacts', 'Delete'),
					action: this.deleteAddressbook
				})
			}
			return menu
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
			console.log('renaming') // eslint-disable-line
			let addressbook = this.addressbook
			let newName = this.newName
			console.log(this.newName) // eslint-disable-line
			this.$store.dispatch('renameAddressbook', { addressbook, newName }).then(this.editingName = false)
		},
		copyLink() {
			// copy link for addressbook to clipboard
			this.$copyText(this.addressbook.url).then(e => {
				this.copySuccess = true
				this.copied = true
			}, e => {
				this.copySuccess = false
				this.copied = true

			})
			// timeout sets the text back to copy to show text was copied
			setTimeout(() => { this.copied = false }, 1500)
		}
	}
}
</script>
