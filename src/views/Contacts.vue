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
				<add-address-book :addressbooks="addressbooks" />

				<import-contacts :addressbooks="addressbooks" class="settings-section" />
				<sort-contacts class="settings-section" />

			</template>
		</app-navigation>

		<!-- main content -->
		<div id="app-content">
			<div id="app-content-wrapper">
				<!-- contacts list -->
				<content-list :list="contactsList" :contacts="contacts" :loading="loading" />
				<!-- main contacts details -->
				<content-details :loading="loading" :uid="selectedContact" />
			</div>
		</div>

	</div>
</template>

<script>
import appNavigation from '../components/appNavigation'
import contentList from '../components/contentList'
import contentDetails from '../components/contentDetails'
import addressBook from '../components/addressBook'
import Contact from '../models/contact'
import importContacts from '../components/settingsNavigation/importContacts'
import sortContacts from '../components/settingsNavigation/sortContacts'
import addAddressBook from '../components/settingsNavigation/addAddressBook'

export default {
	components: {
		appNavigation,
		contentList,
		contentDetails,
		addressBook,
		importContacts,
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
			loading: true
		}
	},

	computed: {
		// store getters
		addressbooks() {
			return this.$store.getters.getAddressbooks
		},
		sortedContacts() {
			return this.$store.getters.getSortedContacts
		},
		contacts() {
			return this.$store.getters.getContacts
		},
		groups() {
			return this.$store.getters.getGroups
		},
		orderKey() {
			return this.$store.getters.getOrderKey
		},

		// first enabled addressbook of the list
		defaultAddressbook() {
			return this.addressbooks.find(addressbook => addressbook.enabled)
		},

		/**
		 * contacts list based on the selected group
		 * filters are pretty fast, so let's only intersect the groups
		 * contacts and the full sorted contacts List
		 */
		contactsList() {
			if (this.selectedGroup === t('contacts', 'All contacts')) {
				return this.sortedContacts
			}
			let group = this.groups.filter(group => group.name === this.selectedGroup)[0]
			if (group) {
				return this.sortedContacts.filter(contact => group.contacts.indexOf(contact.key) >= 0)
			}
			return []
		},

		// generate groups menu from groups store
		groupsMenu() {
			return this.groups.map(group => {
				return {
					id: group.name.replace(' ', '_'),
					key: group.name.replace(' ', '_'),
					router: {
						name: 'group',
						params: { selectedGroup: group.name }
					},
					text: group.name,
					utils: {
						counter: group.contacts.length
					}
				}
			})
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
				items: this.allGroup.concat(this.groupsMenu)
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
					counter: this.sortedContacts.length
				}
			}]
		}
	},

	watch: {
		// watch url change and group select
		selectedGroup: function() {
			this.selectFirstContactIfNone()
		},
		// watch url change and contact select
		selectedContact: function() {
			this.selectFirstContactIfNone()
		}
	},

	beforeMount() {
		// get addressbooks then get contacts
		this.$store.dispatch('getAddressbooks')
			.then(() => {
				Promise.all(this.addressbooks.map(async addressbook => {
					await this.$store.dispatch('getContactsFromAddressBook', addressbook)
				})).then(() => {
					this.loading = false
					this.selectFirstContactIfNone()
				})
			})
		// check local storage for orderKey
		if (localStorage.getItem('orderKey')) {
			// run setOrder mutation with local storage key
			this.$store.commit('setOrder', localStorage.getItem('orderKey'))
		}
	},

	methods: {
		newContact() {
			let contact = new Contact('BEGIN:VCARD\nVERSION:4.0\nFN:' + t('contacts', 'New Contact') + '\nCATEGORIES:' + this.selectedGroup + '\nEND:VCARD', this.defaultAddressbook)
			this.$store.dispatch('addContact', contact)
			this.$router.push({
				name: 'contact',
				params: {
					selectedGroup: this.selectedGroup,
					selectedContact: contact.key
				}
			})
		},

		/**
		 * Dispatch sorting update request to the store
		 *
		 * @param {Object} state Default state
		 * @param {Array} addressbooks Addressbooks
		 */
		updateSorting(orderKey = 'displayName') {
			this.$store.commit('setOrder', orderKey)
			this.$store.commit('sortContacts')
		},

		selectFirstContactIfNone() {
			let inList = this.contactsList.findIndex(contact => contact.key === this.selectedContact) > -1
			if (this.selectedContact === undefined || !inList) {
				if (this.selectedContact && !inList) {
					OC.Notification.showTemporary(t('contacts', 'Contact not found'))
				}
				this.$router.push({
					name: 'contact',
					params: {
						selectedGroup: this.selectedGroup,
						selectedContact: Object.values(this.contactsList)[0].key
					}
				})
			}
		}
	}
}
</script>
