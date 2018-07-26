<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Team Popcorn <teampopcornberlin.gmail.com>
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
		<li :class="{'disabled': !addressbook.enabled}">
			<!-- addressbook name -->
			<span class="addressbook-name">{{ addressbook.displayName }}</span>
			<!-- sharing button -->
			<a href="#" class="addressbook-share icon-shared"
				@click="toggleShare" />
			<!-- popovermenu -->
			<a v-click-outside="closeMenu" href="#" class="addressbook-menu"
				@click="toggleMenu">
				<div class="icon-more" />
				<div :class="{'open': menuOpen}" class="popovermenu">
					<popover-menu :menu="menu"/>
				</div>
			</a>
		</li>
		<!-- sharing input -->
		<share-address-book v-if="shareOpen" :addressbook="addressbook" />
	</div>
</template>

<script>
import popoverMenu from './popoverMenu'
import shareAddressBook from './settingsNavigation/shareAddressBook'
import clickOutside from 'vue-click-outside'

export default {
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
		menu() {
			return []
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
