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

		<!-- new-contact-button + navigation + settings -->
		<app-navigation :menu="menu">
			<!-- settings -->
			<settings-section v-if="!loading" slot="settings-content" />
		</app-navigation>

		<!-- main content -->
		<div id="app-content">
			<div id="app-content-wrapper">
				<!-- loading -->
				<import-screen v-if="importState.stage !== 'default'" />
				<template v-else>
					<!-- contacts list -->
					<content-list :list="contactsList" :contacts="contacts" :loading="loading"
						:search-query="searchQuery" />
					<!-- main contacts details -->
					<contact-details :loading="loading" :uid="selectedContact" />
				</template>
			</div>
		</div>

	</div>
</template>

<script>
import { AppNavigation } from 'nextcloud-vue'

import SettingsSection from '../components/SettingsSection'
import ContentList from '../components/ContentList'
import ContactDetails from '../components/ContactDetails'
import ImportScreen from '../components/ImportScreen'

import Contact from '../models/contact'
import rfcProps from '../models/rfcProps.js'

import client from '../services/cdav.js'

export default {
	components: {
		AppNavigation,
		SettingsSection,
		ContentList,
		ContactDetails,
		ImportScreen
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
			loading: true,
			searchQuery: ''
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
		importState() {
			return this.$store.getters.getImportState
		},
		// first enabled addressbook of the list
		defaultAddressbook() {
			return this.addressbooks.find(addressbook => addressbook.readOnly !== false)
		},

		/**
		 * Contacts list based on the selected group.
		 * Those filters are pretty fast, so let's only
		 * intersect the groups contacts and the full
		 * sorted contacts List.
		 *
		 * @returns {Array}
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
			}).sort(function(a, b) {
				return parseInt(b.utils.counter) - parseInt(a.utils.counter)
			})
		},

		// building the main menu
		menu() {
			if (this.loading) {
				return {
					id: 'groups-list',
					loading: true
				}
			}
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

	mounted() {
		/**
		 * Register search
		 */
		this.search = new OCA.Search(this.search, this.resetSearch)
	},

	beforeMount() {
		// get addressbooks then get contacts
		client.connect({ enableCardDAV: true }).then(() => {
			console.debug('Connected to dav!', client)
			this.$store.dispatch('getAddressbooks')
				.then((addressbooks) => {

					// No addressbooks? Create a new one!
					if (addressbooks.length === 0) {
						this.$store.dispatch('appendAddressbook', { displayName: t('contacts', 'Contacts') })
							.then(() => {
								this.fetchContacts()
							})
					// else, let's get those contacts!
					} else {
						this.fetchContacts()
					}
				})
				// check local storage for orderKey
			if (localStorage.getItem('orderKey')) {
				// run setOrder mutation with local storage key
				this.$store.commit('setOrder', localStorage.getItem('orderKey'))
			}
		})
	},

	methods: {
		newContact() {
			let contact = new Contact('BEGIN:VCARD\nVERSION:4.0\nEND:VCARD', this.defaultAddressbook)
			contact.fullName = 'New contact'
			// itterate over all properties (filter is not usable on objects and we need the key of the property)
			for (let name in rfcProps.properties) {
				if (rfcProps.properties[name].default) {
					let defaultData = rfcProps.properties[name].defaultValue
					// add default field
					let property = contact.vCard.addPropertyWithValue(name, defaultData.value)
					// add default type
					if (defaultData.type) {
						property.setParameter('type', defaultData.type)

					}
				}
			}
			if (this.selectedGroup !== t('contacts', 'All contacts')) {
				contact.vCard.addPropertyWithValue('categories', this.selectedGroup)
			}
			this.$store.dispatch('addContact', contact)
				.then(() => {
					this.$router.push({
						name: 'contact',
						params: {
							selectedGroup: this.selectedGroup,
							selectedContact: contact.key
						}
					})
				})
		},

		/**
		 * Dispatch sorting update request to the store
		 *
		 * @param {string} orderKey the object key to order by
		 */
		updateSorting(orderKey = 'displayName') {
			this.$store.commit('setOrder', orderKey)
			this.$store.commit('sortContacts')
		},

		/**
		 * Fetch the contacts of each addressbooks
		 */
		fetchContacts() {
			// wait for all addressbooks to have fetch their contacts
			Promise.all(this.addressbooks.map(addressbook => {
				if (addressbook.enabled) {
					return this.$store.dispatch('getContactsFromAddressBook', { addressbook })
				}
			})).then(results => {
				this.loading = false
				this.selectFirstContactIfNone()
			})
		},

		/**
		 * Select the first contact of the list
		 * if none are selected already
		 */
		selectFirstContactIfNone() {
			let inList = this.contactsList.findIndex(contact => contact.key === this.selectedContact) > -1
			if (this.selectedContact === undefined || !inList) {
				if (this.selectedContact && !inList) {
					OC.Notification.showTemporary(t('contacts', 'Contact not found'))
				}
				if (Object.keys(this.contactsList).length) {
					this.$router.push({
						name: 'contact',
						params: {
							selectedGroup: this.selectedGroup,
							selectedContact: Object.values(this.contactsList)[0].key
						}
					})
				}
			}
		},

		/* SEARCH */
		search(query) {
			this.searchQuery = query
		},
		resetSearch() {
			this.search('')
		}
	}
}
</script>
