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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->
<template>
	<div>
		<li :class="{'addressbook--disabled': !addressbook.enabled}" class="addressbook">
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
import ShareAddressBook from './SettingsAddressbookShare'

export default {
	name: 'SettingsAddressbook',

	components: {
		ShareAddressBook
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
			toggleEnabledLoading: false,
			deleteAddressbookLoading: false,
			renameLoading: false,
			copyLoading: false
		}
	},
	computed: {
		enabled() {
			return this.addressbook.enabled
		},
		// building the popover menu
		menu() {
			let menu = [
				{
					href: this.addressbook.url,
					icon: this.copyLoading ? 'icon-loading-small' : 'icon-public',
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
					text: t('contacts', 'Download')
				}
			]

			// check if addressbook is readonly
			if (!this.addressbook.readOnly) {
				menu.push({
					icon: this.renameLoading ? 'icon-loading-small' : 'icon-rename',
					// check if editing name
					input: this.editingName ? 'text' : null,
					text: !this.editingName ? t('contacts', 'Rename') : '',
					action: !this.editingName ? this.renameAddressbook : this.updateAddressbookName,
					value: this.addressbook.displayName,
					placeholder: this.addressbook.displayName
				},
				{
					text: this.enabled ? t('contacts', 'Enabled') : t('contacts', 'Disabled'),
					icon: this.toggleEnabledLoading ? 'icon-loading-small' : null,
					input: this.toggleEnabledLoading ? null : 'checkbox',
					key: 'enableAddressbook',
					model: this.enabled,
					action: this.toggleAddressbookEnabled
				})

			}
			// check to ensure last addressbook is not deleted.
			if (this.$store.getters.getAddressbooks.length > 1) {
				menu.push({
					icon: this.deleteAddressbookLoading ? 'icon-loading-small' : 'icon-delete',
					text: t('contacts', 'Delete'),
					action: this.deleteAddressbook
				})
			}
			return menu
		}
	},
	watch: {
		menuOpen: function() {
			if (this.menuOpen === false) {
				this.editingName = false
			}
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
			// change to loading status
			this.toggleEnabledLoading = true
			setTimeout(() => {
				try {
					this.$store.dispatch('toggleAddressbookEnabled', this.addressbook)
				} catch (err) {
					// error handling
					console.error(err)
					OC.Notification.showTemporary(t('contacts', 'Enabled toggle of addressbook was not successful.'))
				} finally {
					// stop loading status regardless of outcome
					this.toggleEnabledLoading = false
				}
			}, 500)
		},
		deleteAddressbook() {
			// change to loading status
			this.deleteAddressbookLoading = true
			setTimeout(() => {
				try {
					this.$store.dispatch('deleteAddressbook', this.addressbook)
				} catch (err) {
					// error handling
					console.error(err)
					OC.Notification.showTemporary(t('contacts', 'Deletion of addressbook was not successful.'))
				} finally {
					// stop loading status regardless of outcome
					this.deleteAddressbookLoading = false
				}
			}, 500)
		},
		renameAddressbook() {
			this.editingName = true
		},
		updateAddressbookName(e) {
			let addressbook = this.addressbook
			// New name for addressbook - inputed value from form
			let newName = e.target[0].value
			// change to loading status
			this.renameLoading = true
			setTimeout(() => {
				try {
					this.$store.dispatch('renameAddressbook', { addressbook, newName })
				} catch (err) {
					// error handling
					console.error(err)
					OC.Notification.showTemporary(t('contacts', 'Renaming of addressbook was not successful.'))
				} finally {
					this.editingName = false
					// stop loading status regardless of outcome
					this.renameLoading = false
					// close popover menu
					this.menuOpen = false
				}
			}, 500)
		},
		copyLink(event) {
			// change to loading status
			this.copyLoading = true
			event.stopPropagation()

			// copy link for addressbook to clipboard
			this.$copyText(this.addressbook.url)
				.then(e => {
					event.preventDefault()
					this.copySuccess = true
					this.copied = true
					// Notify addressbook was copied
					OC.Notification.showTemporary(t('contacts', 'Addressbook copied to clipboard'))
				}, e => {
					this.copySuccess = false
					this.copied = true
					OC.Notification.showTemporary(t('contacts', 'Addressbook was not copied to clipboard.'))
				}).then(() => {
					// stop loading status regardless of outcome
					this.copyLoading = false
					this.copied = false
				})
		}
	}
}
</script>
