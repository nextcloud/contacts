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
				<ul>
					<address-book v-for="addressbook in addressbooks" :key="addressbook.id" :addressbook="addressbook" />
				</ul>
			</template>
		</app-navigation>

		<!-- main content -->
		<div id="app-content">
			<div id="app-content-wrapper">
				<!-- contacts list -->
				<content-list :list="sortedContacts" :contacts="contacts" :loading="loading" />
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

export default {
	components: {
		appNavigation,
		contentList,
		contentDetails,
		addressBook
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
					counter: this.sortedContacts.length
				}
			}, {
				id: 'everyone2',
				key: 'everyone2',
				icon: 'icon-contacts-dark',
				router: {
					name: 'group',
					params: { selectedGroup: t('contacts', 'All contacts2') }
				},
				text: t('contacts', 'All contacts2'),
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
	},
	methods: {
		newContact() {
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
			let inList = Object.keys(this.contacts).findIndex(key => key === this.selectedContact) > -1
			if (this.selectedContact === undefined || !inList) {
				if (this.selectedContact && !inList) {
					OC.Notification.showTemporary(t('contacts', 'Contact not found'))
				}
				this.$router.push({
					name: 'contact',
					params: {
						selectedGroup: this.selectedGroup,
						selectedContact: Object.values(this.contacts)[0].key
					}
				})
			}
		}
	}
}
</script>
