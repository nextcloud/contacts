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
	<div id="app-setting">
		<appNavigation :menu="menu">
			<template slot="settings-content">
				<ul class="addressBookList">
					<address-book v-for="addressbook in addressbooks" :key="addressbook.id" :addressbook="addressbook" />
					<add-address-book />
				</ul>
				<contact-import class="settings-section" />
				<sort-contacts class="settings-section ng-isolate-scope" />
			</template>
		</appNavigation>
	</div>
</template>

<script>
import appNavigation from '../components/appNavigation'
import addressBook from '../components/addressBook'
import contactImport from '../components/settingsNavigation/contactImport'
import sortContacts from '../components/settingsNavigation/sortContacts'
import addAddressBook from '../components/settingsNavigation/addAddressBook'

export default {
	components: {
		appNavigation,
		addressBook,
		contactImport,
		sortContacts,
		addAddressBook
	},
	data() {
		return {
		}
	},
	computed: {
		addressbooks() {
			return this.$store.getters.getAddressbooks
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
