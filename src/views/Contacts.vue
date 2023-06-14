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
	<Content :app-name="appName">
		<!-- new-contact-button + navigation + settings -->
		<RootNavigation :contacts-list="contactsList"
			:loading="loadingContacts || loadingCircles"
			:selected-group="selectedGroup"
			:selected-contact="selectedContact">
			<!-- new-contact-button -->
			<SettingsImportContacts v-if="!loadingContacts && isEmptyGroup" />
			<Button v-if="!loadingContacts"
				class="new-contact-button"
				type="primary"
				button-id="new-contact-button"
				:wide="true"
				:disabled="!defaultAddressbook"
				@click="newContact">
				<template #icon>
					<IconAdd :size="20" />
				</template>
				{{ t('contacts','New contact') }}
			</Button>
		</RootNavigation>

		<!-- Main content: circle, chart or contacts -->
		<CircleContent v-if="selectedCircle"
			:loading="loadingCircles" />
		<ChartContent v-else-if="selectedChart"
			:contacts-list="contacts" />
		<ContactsContent v-else
			:contacts-list="contactsList"
			:loading="loadingContacts"
			@new-contact="newContact" />

		<!-- Import modal -->
		<Modal v-if="isImporting"
			:clear-view-delay="-1"
			:can-close="isImportDone"
			@close="closeImport">
			<ImportView @close="closeImport" />
		</Modal>

		<!-- Select contacts group modal -->
		<ContactsPicker />
	</Content>
</template>

<script>
import { GROUP_ALL_CONTACTS, GROUP_NO_GROUP_CONTACTS, ROUTE_CIRCLE } from '../models/constants.ts'

import {
	isMobile,
	NcButton as Button,
	NcContent as Content,
	NcModal as Modal,
} from '@nextcloud/vue'

import { showError } from '@nextcloud/dialogs'
import { VCardTime } from 'ical.js'

import CircleContent from '../components/AppContent/CircleContent.vue'
import ChartContent from '../components/AppContent/ChartContent.vue'
import ContactsContent from '../components/AppContent/ContactsContent.vue'
import ContactsPicker from '../components/EntityPicker/ContactsPicker.vue'
import ImportView from './Processing/ImportView.vue'
import RootNavigation from '../components/AppNavigation/RootNavigation.vue'
import SettingsImportContacts from '../components/AppNavigation/Settings/SettingsImportContacts.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'

import Contact from '../models/contact.js'
import rfcProps from '../models/rfcProps.js'

import client from '../services/cdav.js'
import isCirclesEnabled from '../services/isCirclesEnabled.js'

export default {
	name: 'Contacts',

	components: {
		Button,
		CircleContent,
		ChartContent,
		ContactsContent,
		ContactsPicker,
		Content,
		ImportView,
		IconAdd,
		Modal,
		RootNavigation,
		SettingsImportContacts,
	},

	mixins: [
		isMobile,
	],

	// passed by the router
	props: {
		selectedCircle: {
			type: String,
			default: undefined,
		},
		selectedGroup: {
			type: String,
			default: undefined,
		},
		selectedContact: {
			type: String,
			default: undefined,
		},
		selectedChart: {
			type: String,
			default: undefined,
		},
	},

	data() {
		return {
			appName,

			// Let's but the loading state to true if circles is enabled
			loadingCircles: isCirclesEnabled,
			loadingContacts: true,
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
		sortedContacts() {
			return this.$store.getters.getSortedContacts
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
		isEmptyGroup() {
			return this.contactsList.length === 0
		},
		/**
		 * Are we importing contacts ?
		 *
		 * @return {boolean}
		 */
		isImporting() {
			return this.importState.stage !== 'default'
		},
		/**
		 * Are we done importing contacts ?
		 *
		 * @return {boolean}
		 */
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
		 * @return {Array}
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
	},

	watch: {
		// watch url change and group select
		selectedGroup() {
			if (!this.isMobile && !this.selectedChart) {
				this.selectFirstContactIfNone()
			}
		},
		// watch url change and contact select
		selectedContact() {
			if (!this.isMobile && !this.selectedChart) {
				this.selectFirstContactIfNone()
			}
		},
	},

	mounted() {
		// Register search
		this.search = new OCA.Search(this.search, this.resetSearch)

		if (this.isCirclesEnabled) {
			this.logger.info('Circles frontend enabled')
		} else {
			this.logger.info('No compatible version of circles found')
		}
	},

	async beforeMount() {
		// get addressbooks then get contacts
		client.connect({ enableCardDAV: true }).then(() => {
			this.logger.debug('Connected to dav!', { client })
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

		// Get circles if enabled
		if (isCirclesEnabled) {
			this.$store.dispatch('getCircles').then(() => {
				this.loadingCircles = false
			})
		}
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

			contact.fullName = t('contacts', 'Name')
			rev.fromUnixTime(Date.now() / 1000)
			contact.rev = rev

			// itterate over all properties (filter is not usable on objects and we need the key of the property)
			const properties = rfcProps.properties
			for (const name in properties) {
				if (properties[name].default) {
					const defaultData = properties[name].defaultValue
					let defaultValue = defaultData.value
					if (Array.isArray(defaultValue)) {
						defaultValue = [...defaultValue]
					}
					// add default field
					const property = contact.vCard.addPropertyWithValue(name, defaultValue)
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
			// don't filter disabled at this point, because sum of contacts per address book is shown
			Promise.all(this.addressbooks
				.map(addressbook => {
					return this.$store.dispatch('getContactsFromAddressBook', { addressbook })
				})
			).then(results => {
				this.loadingContacts = false
				if (!this.isMobile && !this.selectedChart) {
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
				if (!this.selectedCircle
					&& !this.groups.find(group => group.name === this.selectedGroup)
					&& GROUP_ALL_CONTACTS !== this.selectedGroup
					&& GROUP_NO_GROUP_CONTACTS !== this.selectedGroup
					&& ROUTE_CIRCLE !== this.selectedGroup) {
					showError(t('contacts', 'Group {group} not found', { group: this.selectedGroup }))
					console.error('Group not found', this.selectedGroup)

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

		/**
		 * Done importing, the user closed the import status screen
		 */
		closeImport() {
			this.$store.dispatch('changeStage', 'default')
		},
	},
}
</script>

<style lang="scss" scoped>
.new-contact-button {
	margin-top: 4px;
}
</style>
