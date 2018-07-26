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

		<!-- new-button + navigation + settings -->
		<app-navigation :menu="menu">
			<!-- settings -->
			<template slot="settings-content">
				<ul id="address-book-list">
					<address-book v-for="addressbook in addressbooks" :key="addressbook.id" :addressbook="addressbook" />
				</ul>
				<add-address-book />
				<contact-import class="settings-section" />
				<sort-contacts class="settings-section" />
			</template>
		</app-navigation>

		<!-- main content -->
		<div id="app-content">
			<div id="app-content-wrapper">
				<!-- contacts list -->
				<content-list :list="contacts" :loading="loading" />
				<!-- main contacts details -->
				<div :class="{'icon-loading': loading}" class="app-content-detail" />
			</div>
		</div>

	</div>
</template>

<script>
import appNavigation from '../components/appNavigation'
import contentList from '../components/contentList'
import addressBook from '../components/addressBook'
import contactImport from '../components/settingsNavigation/contactImport'
import sortContacts from '../components/settingsNavigation/sortContacts'
import addAddressBook from '../components/settingsNavigation/addAddressBook'

export default {
	components: {
		appNavigation,
		contentList,
		addressBook,
		contactImport,
		sortContacts,
		addAddressBook
	},
	// passed by the router
	props: {
		selectedGroup: {
			type: String,
			default: undefined,
			required: true
		},
		selectedContact: {
			type: String,
			default: undefined
		}
	},
	data() {
		return {
			list: [],
			loading: true
		}
	},
	computed: {
		// store getters
		addressbooks() {
			return this.$store.getters.getAddressbooks
		},
		contacts() {
			return this.$store.getters.getContacts
		},
		groups() {
			return this.$store.getters.getGroups
		},

		// building the main menu
		menu() {
			return {
				id: 'groups-list',
				new: {
					id: 'new-contact-button',
					text: t('contacts', 'New contact'),
					icon: 'icon-add',
					action: this.newContact
				},
				items: this.allGroup.concat(this.groups)
			}
		},
		// default group for every contacts
		allGroup() {
			return [{
				id: 'everyone',
				key: 'everyone',
				icon: 'icon-contacts-dark',
				router: {
					name: 'group',
					params: { selectedGroup: t('contacts', 'All contacts') }
				},
				text: t('contacts', 'All contacts'),
				utils: {
					counter: this.contacts.length
				}
			}]
		}
	},
	watch: {
		// watch url change and group select
		selectedGroup: function(val, old) {
			console.debug(val, old)
		}
	},
	beforeMount() {
		// get addressbooks then get contacts
		this.$store.dispatch('getAddressbooks')
			.then(() => {
				// TODO: await then toggle loading state
				this.addressbooks.forEach(addressbook => {
					this.$store.dispatch('getContactsFromAddressBook', addressbook)
				})
				this.loading = false
			})
	},
	methods: {
		newContact() {
		}
	}
}
</script>
