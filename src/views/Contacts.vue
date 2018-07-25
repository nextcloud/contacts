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
	<div id="content" class="app-contacts">
		<app-navigation :menu="menu">
			<template slot="settings-content">
				<ul>
					<address-book v-for="addressbook in addressbooks" :key="addressbook.id" :addressbook="addressbook" />
				</ul>
			</template>
		</app-navigation>
		<div id="app-content">
			<div id="app-content-wrapper">
				<content-list :list="contacts" />
				<div class="app-content-detail"/>
			</div>
		</div>
	</div>
</template>

<script>
import appNavigation from '../components/appNavigation'
import contentList from '../components/contentList'
import addressBook from '../components/addressBook'

export default {
	components: {
		appNavigation,
		contentList,
		addressBook
	},
	data() {
		return {
			list: []
		}
	},
	computed: {
		addressbooks() {
			return this.$store.getters.getAddressbooks
		},
		contacts() {
			return this.$store.getters.getContacts
		},
		menu() {
			return {}
		}
	},
	beforeMount() {
		// get addressbooks then get contacts
		this.$store.dispatch('getAddressbooks')
			.then(() => {
				this.addressbooks.forEach(addressbook => {
					this.$store.dispatch('getContactsFromAddressBook', addressbook)
				})
			})
	}
}
</script>
