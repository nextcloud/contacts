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
	<Content app-name="contacts">
		<!-- go back to list when in details mode -->
		<a v-if="selectedContact && isMobile"
			class="app-details-toggle icon-confirm"
			href="#"
			@click.stop.prevent="showList" />

		<!-- new-contact-button + navigation + settings -->
		<RootNavigation
			:contacts-list="contactsList"
			:loading="loading"
			:selected-group="selectedGroup"
			:selected-contact="selectedContact"
			@addContactsToGroup="addContactsToGroup">
			<!-- new-contact-button -->
			<AppNavigationNew v-if="!loading"
				button-id="new-contact-button"
				:text="t('contacts','New contact')"
				button-class="icon-add"
				:disabled="!defaultAddressbook"
				@click="newContact" />
		</RootNavigation>

		<AppContent>
			<div v-if="loading">
				<EmptyContent icon="icon-loading">
					{{ t('contacts', 'Loading contacts …') }}
				</EmptyContent>
			</div>

			<div v-else-if="isEmptyGroup && !isRealGroup">
				<EmptyContent icon="icon-contacts-dark">
					{{ t('contacts', 'There are no contacts yet') }}
					<template #desc>
						<button class="primary" @click="newContact">
							{{ t('contacts', 'Create contact') }}
						</button>
					</template>
				</EmptyContent>
			</div>

			<div v-else-if="isEmptyGroup && isRealGroup">
				<EmptyContent icon="icon-contacts-dark">
					{{ t('contacts', 'There are no contacts in this group') }}
					<template #desc>
						<button v-if="contacts.length === 0" class="primary" @click="addContactsToGroup(selectedGroup)">
							{{ t('contacts', 'Create contacts') }}
						</button>
						<button v-else class="primary" @click="addContactsToGroup(selectedGroup)">
							{{ t('contacts', 'Add contacts') }}
						</button>
					</template>
				</EmptyContent>
			</div>

			<div v-else id="app-content-wrapper">
				<!-- contacts list -->
				<ContactsList
					v-if="!loading"
					:list="contactsList"
					:contacts="contacts"
					:search-query="searchQuery" />

				<!-- main contacts details -->
				<ContactDetails :contact-key="selectedContact" />
			</div>
		</AppContent>

		<!-- Import modal -->
		<Modal v-if="isImporting"
			:clear-view-delay="-1"
			:can-close="isImportDone"
			@close="closeImport">
			<ImportView @close="closeImport" />
		</Modal>

		<!-- Bulk contacts edit modal -->
		<Modal v-if="isProcessing || isProcessDone"
			:clear-view-delay="-1"
			:can-close="isProcessDone"
			@close="closeProcess">
			<AddToGroupView v-bind="processStatus" @close="closeProcess" />
		</Modal>

		<!-- Select contacts group modal -->
		<EntityPicker v-else-if="showContactPicker"
			:confirm-label="t('contacts', 'Add to group {group}', { group: contactPickerforGroup.name})"
			:data-types="pickerTypes"
			:data-set="pickerData"
			@close="onContactPickerClose"
			@submit="onContactPickerPick" />
	</Content>
</template>

<script>
import { GROUP_ALL_CONTACTS, GROUP_NO_GROUP_CONTACTS } from '../models/groups'

import AppContent from '@nextcloud/vue/dist/Components/AppContent'
import AppNavigationNew from '@nextcloud/vue/dist/Components/AppNavigationNew'
import Content from '@nextcloud/vue/dist/Components/Content'
import EmptyContent from '@nextcloud/vue/dist/Components/EmptyContent'
import isMobile from '@nextcloud/vue/dist/Mixins/isMobile'
import Modal from '@nextcloud/vue/dist/Components/Modal'

import { showError } from '@nextcloud/dialogs'
import { VCardTime } from 'ical.js'
import pLimit from 'p-limit'

import AddToGroupView from './Processing/AddToGroupView'
import ContactDetails from '../components/ContactDetails'
import ContactsList from '../components/ContactsList'
import EntityPicker from '../components/EntityPicker/EntityPicker'
import ImportView from './Processing/ImportView'
import RootNavigation from '../components/AppNavigation/RootNavigation'

import Contact from '../models/contact'
import rfcProps from '../models/rfcProps'

import client from '../services/cdav'
import appendContactToGroup from '../services/appendContactToGroup'

export default {
	name: 'Contacts',

	components: {
		AddToGroupView,
		AppContent,
		AppNavigationNew,
		ContactDetails,
		ContactsList,
		Content,
		EmptyContent,
		EntityPicker,
		ImportView,
		Modal,
		RootNavigation,
	},

	mixins: [
		isMobile,
	],

	// passed by the router
	props: {
		selectedGroup: {
			type: String,
			default: undefined,
		},
		selectedContact: {
			type: String,
			default: undefined,
		},
	},

	data() {
		return {
			loading: true,

			// Add to group picker
			searchQuery: '',
			showContactPicker: false,
			contactPickerforGroup: null,
			pickerData: [],
			pickerTypes: [{
				id: 'contact',
				label: t('contacts', 'Contacts'),
			}],

			// Bulk processing
			isProcessing: false,
			isProcessDone: false,
			processStatus: {
				failed: 0,
				progress: 0,
				success: 0,
				total: 0,
				name: '',
			},
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

		/**
		 * Are we importing contacts ?
		 * @returns {boolean}
		 */
		isImporting() {
			return this.importState.stage !== 'default'
		},
		/**
		 * Are we done importing contacts ?
		 * @returns {boolean}
		 */
		isImportDone() {
			return this.importState.stage === 'done'
		},

		// first enabled addressbook of the list
		defaultAddressbook() {
			return this.addressbooks.find(addressbook => !addressbook.readOnly && addressbook.enabled)
		},

		/**
		 * Is this a real group ?
		 * Aka not a dynamically generated one like `All contacts`
		 * @returns {boolean}
		 */
		isRealGroup() {
			return this.groups.findIndex(group => group.name === this.selectedGroup) > -1
		},
		/**
		 * Is this a real group and is this empty
		 * @returns {boolean}
		 */
		isEmptyRealGroup() {
			return this.contactsList.length === 0
				&& this.isRealGroup
		},
		/**
		 * Is the current group empty
		 * @returns {boolean}
		 */
		isEmptyGroup() {
			return this.contactsList.length === 0
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
	},

	watch: {
		// watch url change and group select
		selectedGroup() {
			if (!this.isMobile) {
				this.selectFirstContactIfNone()
			}
		},
		// watch url change and contact select
		selectedContact() {
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
					const writeableAddressBooks = addressbooks.filter(addressbook => !addressbook.readOnly)

					// No writeable addressbooks? Create a new one!
					if (writeableAddressBooks.length === 0) {
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

		// Get circles
		this.$store.dispatch('getCircles').then(circles => {
			console.debug(`Retrieved ${circles.length} circle(s)`, circles)
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
				contact.groups = [this.selectedGroup]
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
				showError(t('contacts', 'Unable to create the contact.'))
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
			Promise.all(this.addressbooks
				.filter(addressbook => addressbook.enabled)
				.map(addressbook => {
					return this.$store.dispatch('getContactsFromAddressBook', { addressbook })
				})
			).then(results => {
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
			// Do not redirect if pending import
			if (this.$route.name === 'import') {
				return
			}

			const inList = this.contactsList.findIndex(contact => contact.key === this.selectedContact) > -1
			if (this.selectedContact === undefined || !inList) {
				// Unknown contact
				if (this.selectedContact && !inList) {
					showError(t('contacts', 'Contact not found'))
					this.$router.push({
						name: 'group',
						params: {
							selectedGroup: this.selectedGroup,
						},
					})
				}

				// Unknown group
				if (!this.groups.find(group => group.name === this.selectedGroup)
					&& this.GROUP_ALL_CONTACTS !== this.selectedGroup
					&& this.GROUP_NO_GROUP_CONTACTS !== this.selectedGroup) {
					showError(t('contacts', 'Group not found'))
					this.$router.push({
						name: 'root',
					})
					return
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
			this.$store.dispatch('changeStage', 'default')
		},

		// Bulk contacts group management handlers
		addContactsToGroup(group) {
			console.debug('Contacts picker opened for group', group)

			// Get the full group if we provided the group name only
			if (typeof group === 'string') {
				group = this.groups.find(a => a.name === group)
				if (!group) {
					console.error('Cannot add contact to an undefined group', group)
					return
				}
			}

			// Init data set
			this.pickerData = this.sortedContacts
				.map(({ key }) => {
					const contact = this.contacts[key]
					return {
						id: contact.key,
						label: contact.displayName,
						type: 'contact',
						readOnly: contact.addressbook.readOnly,
						groups: contact.groups,
					}
				})
				// No read only contacts
				.filter(contact => !contact.readOnly)
				// No contacts already present in group
				.filter(contact => contact.groups.indexOf(group.name) === -1)

			this.showContactPicker = true
			this.contactPickerforGroup = group
		},

		onContactPickerClose() {
			this.pickerData = []
			this.showContactPicker = false
		},

		onContactPickerPick(selection) {
			console.debug('Adding', selection, 'to group', this.contactPickerforGroup)
			const groupName = this.contactPickerforGroup.name

			this.isProcessing = true
			this.showContactPicker = false

			this.processStatus.total = selection.length
			this.processStatus.name = this.contactPickerforGroup.name
			this.processStatus.progress = 0
			this.processStatus.failed = 0

			// max simultaneous requests
			const limit = pLimit(3)
			const requests = []

			// create the array of requests to send
			selection.map(async entity => {
				try {
					// Get contact
					const contact = this.contacts[entity.id]

					// push contact to server and use limit
					requests.push(limit(() => appendContactToGroup(contact, groupName)
						.then((response) => {
							this.$store.dispatch('addContactToGroup', { contact, groupName })
							this.processStatus.progress++
							this.processStatus.success++
						})
						.catch((error) => {
							this.processStatus.progress++
							this.processStatus.error++
							console.error(error)
						})
					))
				} catch (e) {
					console.error(e)
				}
			})

			Promise.all(requests).then(() => {
				this.isProcessDone = true
				this.showContactPicker = false

				// Auto close after 3 seconds if no errors
				if (this.processStatus.failed === 0) {
					setTimeout(this.closeProcess, 3000)
				}
			})
		},

		closeProcess() {
			this.contactPickerforGroup = null
			this.isProcessing = false
			this.isProcessDone = false

			// Reset
			this.processStatus.failed = 0
			this.processStatus.progress = 0
			this.processStatus.success = 0
			this.processStatus.total = 0
		},

	},
}
</script>

<style lang="scss" scoped>
#newgroup a {
	color: var(--color-text-maxcontrast);
}

#app-content-wrapper {
	display: flex;
}

.app-details-toggle {
	position: absolute;
	width: 44px;
	height: 44px;
	padding: 14px;
	cursor: pointer;
	opacity: .6;
	font-size: 16px;
	line-height: 17px;
	transform: rotate(180deg);
	background-color: var(--color-main-background);
	z-index: 2000;
	&:active,
	&:hover,
	&:focus {
		opacity: 1;
	}

	// Hide app-navigation toggle if shown
	&::v-deep + .app-navigation .app-navigation-toggle {
		display: none;
	}
}
</style>
