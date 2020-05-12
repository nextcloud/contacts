<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Charismatic Claire <charismatic.claire@noservice.noreply>
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
	<Content app-name="contacts" :class="{'icon-loading': loading}">
		<!-- new-contact-button + navigation + settings -->
		<AppNavigation>
			<!-- new-contact-button -->
			<AppNavigationNew v-if="!loading"
				button-id="new-contact-button"
				:text="t('contacts','New contact')"
				button-class="icon-add"
				:disabled="!defaultAddressbook"
				@click="newContact" />

			<!-- groups list -->
			<ul v-if="!loading" id="groups-list">
				<AppNavigationItem v-for="item in menu"
					:key="item.key"
					:to="item.router"
					:title="item.text"
					:icon="item.icon">
					<template slot="actions">
						<ActionButton v-for="action in item.utils.actions"
							:key="action.text"
							:icon="action.icon"
							@click="action.action">
							{{ action.text }}
						</ActionButton>
					</template>
					<AppNavigationCounter slot="counter">
						{{ item.utils.counter }}
					</AppNavigationCounter>
				</AppNavigationItem>

				<AppNavigationItem
					:force-menu="true"
					:menu-open.sync="isNewGroupMenuOpen"
					:title="t('contacts', '+ New group')"
					menu-icon="icon-add"
					@click.prevent.stop="toggleNewGroupMenu">
					<template slot="actions">
						<ActionInput
							icon="icon-contacts-dark"
							:placeholder="t('contacts','Group name')"
							@submit.prevent.stop="createNewGroup" />
					</template>
				</AppNavigationItem>
			</ul>

			<!-- settings -->
			<AppNavigationSettings v-if="!loading">
				<SettingsSection />
			</AppNavigationSettings>
		</AppNavigation>

		<AppContent>
			<!-- go back to list when in details mode -->
			<div v-if="selectedContact && isMobile"
				id="app-details-toggle"
				class="icon-confirm"
				tabindex="0"
				@click="showList" />

			<div id="app-content-wrapper">
				<!-- contacts list -->
				<ContactsList
					v-if="!loading"
					:list="contactsList"
					:contacts="contacts"
					:loading="loading"
					:search-query="searchQuery" />

				<!-- main contacts details -->
				<ContactDetails :loading="loading" :contact-key="selectedContact" />
			</div>
		</AppContent>
		<Modal v-if="isImporting"
			:clear-view-delay="-1"
			:can-close="isImportDone"
			@close="closeImport">
			<ImportScreen />
		</Modal>
	</Content>
</template>

<script>
import AppContent from '@nextcloud/vue/dist/Components/AppContent'
import AppNavigation from '@nextcloud/vue/dist/Components/AppNavigation'
import AppNavigationItem from '@nextcloud/vue/dist/Components/AppNavigationItem'
import AppNavigationCounter from '@nextcloud/vue/dist/Components/AppNavigationCounter'
import AppNavigationNew from '@nextcloud/vue/dist/Components/AppNavigationNew'
import AppNavigationSettings from '@nextcloud/vue/dist/Components/AppNavigationSettings'
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import ActionInput from '@nextcloud/vue/dist/Components/ActionInput'
import Content from '@nextcloud/vue/dist/Components/Content'
import Modal from '@nextcloud/vue/dist/Components/Modal'
import isMobile from '@nextcloud/vue/dist/Mixins/isMobile'

import moment from 'moment'
import download from 'downloadjs'
import { VCardTime } from 'ical.js'

import SettingsSection from '../components/SettingsSection'
import ContactsList from '../components/ContactsList'
import ContactDetails from '../components/ContactDetails'
import ImportScreen from '../components/ImportScreen'

import Contact from '../models/contact'
import rfcProps from '../models/rfcProps'

import client from '../services/cdav'

const GROUP_ALL_CONTACTS = t('contacts', 'All contacts')
const GROUP_NO_GROUP_CONTACTS = t('contacts', 'Not grouped')

export default {
	name: 'Contacts',

	components: {
		AppContent,
		AppNavigation,
		AppNavigationItem,
		AppNavigationCounter,
		AppNavigationNew,
		AppNavigationSettings,
		ActionButton,
		ActionInput,
		ContactDetails,
		ContactsList,
		Content,
		ImportScreen,
		Modal,
		SettingsSection,
	},

	mixins: [
		isMobile,
	],

	// passed by the router
	props: {
		selectedGroup: {
			type: String,
			default: undefined,
			required: true,
		},
		selectedContact: {
			type: String,
			default: undefined,
		},
	},

	data() {
		return {
			isNewGroupMenuOpen: false,
			isCreatingGroup: false,
			loading: true,
			searchQuery: '',
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

		// importing states
		isImporting() {
			return this.importState.stage !== 'default'
		},
		isImportDone() {
			return this.importState.stage === 'done'
		},

		// first enabled addressbook of the list
		defaultAddressbook() {
			return this.addressbooks.find(addressbook => !addressbook.readOnly && addressbook.enabled)
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
			if (this.selectedGroup === GROUP_ALL_CONTACTS) {
				return this.sortedContacts
			} else if (this.selectedGroup === GROUP_NO_GROUP_CONTACTS) {
				return this.ungroupedContacts.map(contact => this.sortedContacts.find(item => item.key === contact.key))
			}
			const group = this.groups.filter(group => group.name === this.selectedGroup)[0]
			if (group) {
				return this.sortedContacts.filter(contact => group.contacts.indexOf(contact.key) >= 0)
			}
			return []
		},

		ungroupedContacts() {
			return this.sortedContacts.filter(contact => this.contacts[contact.key].groups && this.contacts[contact.key].groups.length === 0)
		},

		// generate groups menu from groups store
		groupsMenu() {
			return this.groups.map(group => {
				return {
					id: group.name.replace(' ', '_'),
					key: group.name.replace(' ', '_'),
					router: {
						name: 'group',
						params: { selectedGroup: group.name },
					},
					text: group.name,
					utils: {
						counter: group.contacts.length,
						actions: [
							{
								icon: 'icon-download',
								text: 'Download',
								action: () => this.downloadGroup(group),
							},
						],
					},
				}
			}).sort(function(a, b) {
				return parseInt(b.utils.counter) - parseInt(a.utils.counter)
			})
		},

		// building the main menu
		menu() {
			return this.groupAllGroup.concat(this.groupNotGrouped.concat(this.groupsMenu))
		},

		// default group for every contacts
		groupAllGroup() {
			return [{
				id: 'everyone',
				key: 'everyone',
				icon: 'icon-contacts-dark',
				router: {
					name: 'group',
					params: { selectedGroup: GROUP_ALL_CONTACTS },
				},
				text: GROUP_ALL_CONTACTS,
				utils: {
					counter: this.sortedContacts.length,
				},
			}]
		},

		// default group for every contacts
		groupNotGrouped() {
			if (this.ungroupedContacts.length === 0) {
				return []
			}
			return [{
				id: 'notgrouped',
				key: 'notgrouped',
				icon: 'icon-user',
				router: {
					name: 'group',
					params: { selectedGroup: GROUP_NO_GROUP_CONTACTS },
				},
				text: GROUP_NO_GROUP_CONTACTS,
				utils: {
					counter: this.ungroupedContacts.length,
				},
			}]
		},
	},

	watch: {
		// watch url change and group select
		selectedGroup: function() {
			if (!this.isMobile) {
				this.selectFirstContactIfNone()
			}
		},
		// watch url change and contact select
		selectedContact: function() {
			if (!this.isMobile) {
				this.selectFirstContactIfNone()
			}
		},
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
		async newContact() {
			const rev = new VCardTime()
			const contact = new Contact(`
				BEGIN:VCARD
				VERSION:4.0
				PRODID:-//Nextcloud Contacts v${appVersion}
				END:VCARD
			`.trim().replace(/\t/gm, ''),
			this.defaultAddressbook)

			contact.fullName = t('contacts', 'New contact')
			rev.fromUnixTime(Date.now() / 1000)
			contact.rev = rev

			// itterate over all properties (filter is not usable on objects and we need the key of the property)
			const properties = rfcProps.properties
			for (const name in properties) {
				if (properties[name].default) {
					const defaultData = properties[name].defaultValue
					// add default field
					const property = contact.vCard.addPropertyWithValue(name, defaultData.value)
					// add default type
					if (defaultData.type) {
						property.setParameter('type', defaultData.type)

					}
				}
			}

			// set group if it's selected already
			// BUT NOT if it's the _fake_ groups like all contacts and not grouped
			if ([GROUP_ALL_CONTACTS, GROUP_NO_GROUP_CONTACTS].indexOf(this.selectedGroup) === -1) {
				contact.groups = [ this.selectedGroup ]
			}
			try {
				// this will trigger the proper commits to groups, contacts and addressbook
				await this.$store.dispatch('addContact', contact)
				await this.$router.push({
					name: 'contact',
					params: {
						selectedGroup: this.selectedGroup,
						selectedContact: contact.key,
					},
				})
			} catch (error) {
				OC.Notification.showTemporary(t('contacts', 'Unable to create the contact.'))
				console.error(error)
			}
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
				if (!this.isMobile) {
					this.selectFirstContactIfNone()
				}
			})
		},

		/**
		 * Select the first contact of the list
		 * if none are selected already
		 */
		selectFirstContactIfNone() {
			const inList = this.contactsList.findIndex(contact => contact.key === this.selectedContact) > -1
			if (this.selectedContact === undefined || !inList) {
				if (this.selectedContact && !inList) {
					OC.Notification.showTemporary(t('contacts', 'Contact not found'))
				}
				if (Object.keys(this.contactsList).length) {
					this.$router.push({
						name: 'contact',
						params: {
							selectedGroup: this.selectedGroup,
							selectedContact: Object.values(this.contactsList)[0].key,
						},
					})
				}
			}
		},

		/**
		 * Download vcard promise as vcard file
		 *
		 * @param {Promise} vcardPromise the full vcf file promise
		 */
		async downloadVcardPromise(vcardPromise) {
			vcardPromise.then(response => {
				const filename = moment().format('YYYY-MM-DD_HH-mm') + '_' + response.groupName + '.vcf'
				download(response.data, filename, 'text/vcard')
			})
		},

		/**
		 * Download group of contacts
		 *
		 * @param {Object} group of contacts to be downloaded
		 */
		downloadGroup(group) {
			// get grouped contacts
			let groupedContacts = {}
			group.contacts.map((key) => {
				const id = this.contacts[key].addressbook.id
				groupedContacts = Object.assign({
					[id]: {
						addressbook: this.contacts[key].addressbook,
						contacts: [],
					},
				}, groupedContacts)
				groupedContacts[id].contacts.push(this.contacts[key].url)
			})
			// create vcard promise with the requested contacts
			const vcardPromise = Promise.all(
				Object.keys(groupedContacts).map(key =>
					groupedContacts[key].addressbook.dav.addressbookMultigetExport(groupedContacts[key].contacts)))
				.then(response => ({
					groupName: group.name,
					data: response.map(data => data.body).join(''),
				}))
			// download vcard
			this.downloadVcardPromise(vcardPromise)
		},

		/* SEARCH */
		search(query) {
			this.searchQuery = query
		},
		resetSearch() {
			this.searchQuery = ''
		},

		/**
		 * Show the list and deselect contact
		 */
		showList() {
			// Reset the selected contact
			this.$router.push({
				name: 'contact',
				params: {
					selectedGroup: this.selectedGroup,
					selectedContact: undefined,
				},
			})
		},

		/**
		 * Done importing, the user closed the import status screen
		 */
		closeImport() {
			// TODO: remove after https://github.com/nextcloud/nextcloud-vue/pull/323
			if (this.isImportDone) {
				this.$store.dispatch('changeStage', 'default')
			}
		},

		toggleNewGroupMenu() {
			this.isNewGroupMenuOpen = !this.isNewGroupMenuOpen
		},
		createNewGroup(e) {
			const input = e.target.querySelector('input[type=text]')
			const groupName = input.value.trim()
			this.$store.dispatch('addGroup', groupName)
			this.isNewGroupMenuOpen = false
		},
	},
}
</script>

<style lang="scss" scoped>
#app-content-wrapper {
	display: flex;
}
</style>
