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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<li :class="{'disabled': !addressbook.enabled}">
		<!-- addressbook name -->
		{{ addressbook.displayName }}
		<!-- sharing button -->
		<div class="addressbooklist-icon icon-shared" @click="toggleShare" />
		<!-- sharing input -->
		<div v-if="shareOpen" class="addressBookShares">
			<i v-if="loadingSharees" class="glyphicon glyphicon-refresh" />
			<input type="text" class="shareeInput" >
			<!-- list of possible groups to share with
			<ul class="dropdown-menu">
				<li></li>
			</ul> -->
		</div>
		<!-- popovermenu -->
		<a v-click-outside="closeMenu" href="#" class="addressbook-menu"
			@click="toggleMenu">
			<div class="icon-more" />
			<div :class="{'open': menuOpen}" class="popovermenu">
				<popover-menu :menu="menu"/>
			</div>
		</a>
	</li>
</template>

<script>
import popoverMenu from './popoverMenu'
import clickOutside from 'vue-click-outside'

export default {
	components: {
		popoverMenu,
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
