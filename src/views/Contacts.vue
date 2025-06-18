<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<Content :app-name="appName">
		<!-- new-contact-button + navigation + settings -->
		<RootNavigation :contacts-list="contactsList"
			:loading="loadingContacts || loadingCircles"
			:selected-group="selectedGroup"
			:selected-contact="selectedContact">
			<div class="import-and-new-contact-buttons">
				<SettingsImportContacts v-if="!loadingContacts && isEmptyGroup && !isChartView && !isCirclesView" />
				<!-- new-contact-button -->
				<Button v-if="!loadingContacts"
					:disabled="!defaultAddressbook"
					type="secondary"
					wide
					@click="newContact">
					<template #icon>
						<IconAdd :size="20" />
					</template>
					{{ isCirclesView ? t('contacts','Add member') : t('contacts','New contact') }}
				</Button>
			</div>
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

		<!-- invite accept dialog -->
		 <Modal v-if="showInviteAcceptDialog" >
			<OcmInviteAccept :token="inviteToken" :provider="inviteProvider">
				<template #accept-invite-actions>
					<div class="invite-accept-form__buttons-row">
						<Button @click="acceptInvite">
							<template #icon>
								<IconLoading v-if="loadingUpdate" :size="20" />
								<IconCheck v-else :size="20" />
							</template>
							{{ t('contacts', 'Accept') }}
						</Button>
						<Button @click="cancelInvite">
							<template #icon>
								<IconLoading v-if="loadingUpdate" :size="20" />
								<IconCancel v-else :size="20" />
							</template>
							{{ t('contacts', 'Cancel') }}
						</Button>
					</div>
				</template>
			</OcmInviteAccept>
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
	NcLoadingIcon as IconLoading,
	NcModal as Modal,
} from '@nextcloud/vue'

import axios from '@nextcloud/axios'
import { showError } from '@nextcloud/dialogs'
import { loadState } from '@nextcloud/initial-state'
import ICAL from 'ical.js'

import CircleContent from '../components/AppContent/CircleContent.vue'
import ChartContent from '../components/AppContent/ChartContent.vue'
import ContactsContent from '../components/AppContent/ContactsContent.vue'
import ContactsPicker from '../components/EntityPicker/ContactsPicker.vue'
import ImportView from './Processing/ImportView.vue'
import logger from '../services/logger.js'
import RootNavigation from '../components/AppNavigation/RootNavigation.vue'
import SettingsImportContacts from '../components/AppNavigation/Settings/SettingsImportContacts.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import IconCancel from 'vue-material-design-icons/Cancel.vue'
import IconCheck from 'vue-material-design-icons/Check.vue'

import Contact from '../models/contact.js'
import rfcProps from '../models/rfcProps.js'

import client from '../services/cdav.js'
import isCirclesEnabled from '../services/isCirclesEnabled.js'
import { emit } from '@nextcloud/event-bus'

import usePrincipalsStore from '../store/principals.js'
import OcmInviteAccept from '../components/Ocm/OcmInviteAccept.vue'

const inviteToken = loadState('contacts', 'inviteToken', '')
const inviteProvider = loadState('contacts', 'inviteProvider', '')

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
		IconCancel,
		IconCheck,
		IconLoading,
		Modal,
		OcmInviteAccept,
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
			// The object shorthand syntax is breaking builds (bug in @babel/preset-env)
			/* eslint-disable object-shorthand */
			appName: appName,

			// Let's but the loading state to true if circles is enabled
			loadingCircles: isCirclesEnabled,
			loadingContacts: true,
			showInviteAcceptDialog: false,
			inviteToken: inviteToken,
			inviteProvider: inviteProvider,
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
		circles() {
			return this.$store.getters.getCircles
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
		isChartView() {
			return !!this.selectedChart
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
			} else if (this.selectedGroup === ROUTE_CIRCLE) {
				return []
			}
			const group = this.groups.filter(group => group.name === this.selectedGroup)[0]
			if (group) {
				return this.sortedContacts.filter(contact => group.contacts.indexOf(contact.key) >= 0)
			}
			return []
		},

		isCirclesView() {
			return this.selectedGroup === ROUTE_CIRCLE
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
			const principalsStore = usePrincipalsStore()
			principalsStore.setCurrentUserPrincipal(client)
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
			if (this.isCirclesView) {
				emit('contacts:circles:append', this.selectedCircle.id)
				return
			}
			const rev = new ICAL.VCardTime()
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

			// iterate over all properties (filter is not usable on objects and we need the key of the property)
			const properties = rfcProps.properties
			for (const name in properties) {
				// Show cloud ID property if cloud ID exchange capability present
				// TODO add check for:
				// 	1. OCM invitation flow capability present ?
				//	2. is it active ?
				// then display it more prominently
				if(name === 'cloud') {
					properties[name].default = true
					properties[name].multiple = false
				}
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
					if (!addressbook.enabled) {
						return Promise.resolve()
					}
					return this.$store.dispatch('getContactsFromAddressBook', { addressbook })
				}),
			).then(() => {
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
					// no error when displaying invite accept dialog
					if(this.$route.name !== 'invite_accept_dialog') {
						showError(t('contacts', 'Group {group} not found', { group: this.selectedGroup }))
						console.error('Group not found', this.selectedGroup)
					}
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
				if (this.inviteToken !== "" && this.inviteProvider !== "") {
					this.showInviteAcceptDialog = true
				}
			}
		},

		/**
		 * Done importing, the user closed the import status screen
		 */
		closeImport() {
			this.$store.dispatch('changeStage', 'default')
		},
		async acceptInvite() {
			try {
				const response = await axios.patch('/apps/contacts/ocm/invitations/accept', {
					token: inviteToken,
					provider: inviteProvider,
				})
				window.open(response.data.contact, '_self')
			} catch (error) {
				const message = error.response.data.message
				logger.error('Could not accept invite: ' + message, { error })
			} finally {
				this.showInviteAcceptDialog = false
			}
		},
		cancelInvite() {
			this.showInviteAcceptDialog = false
		}
	},
}
</script>

<style lang="scss" scoped>
.import-and-new-contact-buttons {
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.invite-accept-form__buttons-row {
	display: flex;
	gap: .6em;
	margin-top: 1em;
}
</style>
