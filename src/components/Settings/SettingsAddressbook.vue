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
		<li :class="{'disabled': !addressbook.enabled}" class="addressbook">
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

import clickOutside from 'vue-click-outside'

export default {
	name: 'SettingsAddressbook',
	components: {
		popoverMenu,
		shareAddressBook,
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
			shareOpen: false
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
				text: 'Copy link',
				action: () => {
					alert('share link')
				}
			},
			{
				href: '#',
				icon: 'icon-download',
				text: 'Download',
				action: () => {
					alert('download')
				}
			},
			{
				icon: 'icon-rename',
				text: 'Rename',
				action: () => {
					this.$store.dispatch('renameAddressbook', this.addressbook)
				}
			},
			{
				icon: 'checkbox',
				text: 'Enabled',
				input: 'checkbox',
				model: this.enabled,
				action: () => {
					this.$store.dispatch('toggleAddressbookEnabled', this.addressbook)
				}
			},
			{
				icon: 'icon-delete',
				text: 'Delete',
				action: () => {
					console.log(this.$store) // eslint-disable-line
					this.$store.dispatch('deleteAddressbook', this.addressbook)
				}
			}]
		}
	},
	methods: {
		toggleShare() {
			this.shareOpen = !this.shareOpen
		},
		closeMenu() {
			this.menuOpen = false
		},
		toggleMenu() {
			this.menuOpen = !this.menuOpen
		}
	}
}
</script>
