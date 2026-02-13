<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<Content :app-name="appName">
		<!-- new-contact-button + navigation + settings -->
		<RootNavigation
			:contacts-list="contactsList"
			:loading="loadingContacts || loadingCircles || loadingInvites"
			:selected-group="selectedGroup"
			:selected-contact="selectedContact">
			<div class="import-and-new-contact-buttons">
				<SettingsImportContacts v-if="!loadingContacts && isEmptyGroup && !isChartView && !isCirclesView" />
				<!-- new-contact-button -->
				<NcButton
					v-if="!loadingContacts"
					:disabled="!defaultAddressbook"
					variant="secondary"
					wide
					@click="newContact">
					<template #icon>
						<IconAdd :size="20" />
					</template>
					{{ isCirclesView ? t('contacts', 'Add member') : t('contacts', 'New contact') }}
				</NcButton>
				<!-- invite-contact-button -->
				<NcButton v-if="isOcmInvitesEnabled && !loadingInvites" type="secondary" :wide="true" :disabled="!defaultAddressbook"
					@click="newInvite">
					<template #icon>
						<IconAccountSwitchOutline :size="20" />
					</template>
					{{ t('contacts', 'Invite contact') }}
				</NcButton>
			</div>
		</RootNavigation>

		<!-- Main content: circle, chart or contacts -->
		<UserGroupContent
			v-if="selectedUserGroup"
			:loding="loadingCircles" />
		<CircleContent
			v-if="selectedCircle || selectedUserGroup"
			:loading="loadingCircles" />
		<ChartContent
			v-else-if="selectedChart"
			:contacts-list="contacts" />
		<ContactsContent
			v-else
			:contacts-list="contactsList"
			:loading="loadingContacts"
			@new-contact="newContact" />
		<OcmInvitesContent v-if="isInvitesView"
			:invitesList="invitesList"
			:loading="loadingInvites" />

		<!-- Import modal -->
		<Modal
			v-if="isImporting"
			:clear-view-delay="-1"
			:can-close="isImportDone"
			@close="closeImport">
			<ImportView @close="closeImport" />
		</Modal>

		<!-- new invite form -->
		<Modal v-if="showNewInviteForm" @close="cancelNewInvite">
			<OcmInviteForm :ocmInvite="ocmInvite">
				<template #new-invite-actions>
					<div class="new-invite-form__buttons-row">
						<Button @click="sendNewInvite">
							<template #icon>
								<IconLoading v-if="loadingUpdate" :size="20" />
								<IconCheck v-else :size="20" />
							</template>
							{{ t('contacts', 'Send invite') }}
						</Button>
						<Button @click="cancelNewInvite">
							<template #icon>
								<IconLoading v-if="loadingUpdate" :size="20" />
								<IconCancel v-else :size="20" />
							</template>
							{{ t('contacts', 'Cancel') }}
						</Button>
					</div>
				</template>
			</OcmInviteForm>
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
import { getCurrentUser } from '@nextcloud/auth'
import { showError } from '@nextcloud/dialogs'
import { emit } from '@nextcloud/event-bus'
import {
	NcContent as Content,
	NcLoadingIcon as IconLoading,
	NcModal as Modal,
	NcButton,
} from '@nextcloud/vue'
import ICAL from 'ical.js'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import ChartContent from '../components/AppContent/ChartContent.vue'
import CircleContent from '../components/AppContent/CircleContent.vue'
import ContactsContent from '../components/AppContent/ContactsContent.vue'
import RootNavigation from '../components/AppNavigation/RootNavigation.vue'
import SettingsImportContacts from '../components/AppNavigation/Settings/SettingsImportContacts.vue'
import ContactsPicker from '../components/EntityPicker/ContactsPicker.vue'
import ImportView from './Processing/ImportView.vue'
import IsMobileMixin from '../mixins/IsMobileMixin.ts'
import RouterMixin from '../mixins/RouterMixin.js'
import { GROUP_ALL_CONTACTS, GROUP_NO_GROUP_CONTACTS, ROUTE_CIRCLE, ROUTE_USER_GROUP, GROUP_ALL_OCM_INVITES, ROUTE_NAME_ALL_OCM_INVITES, ROUTE_NAME_INVITE_ACCEPT_DIALOG, ROUTE_NAME_OCM_INVITE } from '../models/constants.ts'
import Contact from '../models/contact.js'
import rfcProps from '../models/rfcProps.js'
import client from '../services/cdav.js'
import isCirclesEnabled from '../services/isCirclesEnabled.js'
import usePrincipalsStore from '../store/principals.js'
import useUserGroupStore from '../store/userGroup.ts'
import IconAccountSwitchOutline from 'vue-material-design-icons/AccountSwitchOutline.vue'
import IconCancel from 'vue-material-design-icons/Cancel.vue'
import IconCheck from 'vue-material-design-icons/Check.vue'
import isOcmInvitesEnabled from '../services/isOcmInvitesEnabled.js'
import OcmInviteAccept from '../components/Ocm/OcmInviteAccept.vue'
import OcmInviteForm from '../components/Ocm/OcmInviteForm.vue'
import OcmInvitesContent from '../components/AppContent/OcmInvitesContent.vue'
import axios from '@nextcloud/axios'
import { loadState } from '@nextcloud/initial-state'

const inviteToken = loadState('contacts', 'inviteToken', '')
const inviteProvider = loadState('contacts', 'inviteProvider', '')

const _default = {
	name: 'Contacts',

	components: {
		NcButton,
		CircleContent,
		ChartContent,
		ContactsContent,
		ContactsPicker,
		Content,
		ImportView,
		IconAccountSwitchOutline,
		IconAdd,
		IconCancel,
		IconCheck,
		IconLoading,
		Modal,
		OcmInviteAccept,
		OcmInviteForm,
		OcmInvitesContent,
		RootNavigation,
		SettingsImportContacts,
	},

	mixins: [
		IsMobileMixin,
		RouterMixin,
	],

	// passed by the router
	props: {
		selectedInvite: {
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
			loadingInvites: isOcmInvitesEnabled,
			showInviteAcceptDialog: false,
			showNewInviteForm: false,
			isOcmInvitesEnabled,
			inviteToken: inviteToken,
			inviteProvider: inviteProvider,
			ocmInvite: { email: '', message: '' },
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
			return this.addressbooks.find((addressbook) => !addressbook.readOnly && addressbook.enabled)
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
			// make sure that the contacts list is also returned when we're viewing invites
			if (this.selectedGroup === GROUP_ALL_CONTACTS 
				|| this.$route.name === ROUTE_NAME_OCM_INVITE 
				|| this.$route.name === ROUTE_NAME_ALL_OCM_INVITES) {
				return this.sortedContacts
			} else if (this.selectedGroup === GROUP_NO_GROUP_CONTACTS) {
				return this.ungroupedContacts.map((contact) => this.sortedContacts.find((item) => item.key === contact.key))
			} else if (this.selectedGroup === ROUTE_CIRCLE || this.selectedGroup === ROUTE_USER_GROUP) {
				return []
			}
			const group = this.groups.filter((group) => group.name === this.selectedGroup)[0]
			if (group) {
				return this.sortedContacts.filter((contact) => group.contacts.indexOf(contact.key) >= 0)
			}
			return []
		},

		invitesList() {
			return this.$store.getters.getSortedOcmInvites
		},

		isInvitesView() {
			return this.$route.name === ROUTE_NAME_OCM_INVITE 
				|| this.$route.name === ROUTE_NAME_ALL_OCM_INVITES
		},

		isCirclesView() {
			return this.selectedGroup === ROUTE_CIRCLE || this.selectedGroup === ROUTE_USER_GROUP
		},

		ungroupedContacts() {
			return this.sortedContacts.filter((contact) => this.contacts[contact.key].groups && this.contacts[contact.key].groups.length === 0)
		},
	},

	watch: {
		// watch url change and group select
		selectedGroup() {
			if (!this.isMobile && !this.selectedChart && !this.selectedInvite) {
				this.$route.name === ROUTE_NAME_ALL_OCM_INVITES ? this.selectFirstOcmInviteIfNone() : this.selectFirstContactIfNone()
			}
		},

		// watch url change and contact select
		selectedContact() {
			if (!this.isMobile && !this.selectedChart && !this.selectedInvite) {
				this.$route.name === ROUTE_NAME_ALL_OCM_INVITES ? this.selectFirstOcmInviteIfNone() : this.selectFirstContactIfNone()
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
		// get addressbooks then get contacts and ocm invites
		client.connect({ enableCardDAV: true }).then(() => {
			this.logger.debug('Connected to dav!', { client })
			const principalsStore = usePrincipalsStore()
			principalsStore.setCurrentUserPrincipal(client)
			this.$store.dispatch('getAddressbooks')
				.then((addressbooks) => {
					const writeableAddressBooks = addressbooks.filter((addressbook) => !addressbook.readOnly)

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
					if (isOcmInvitesEnabled) {
						// set selected group in case of invite routes to keep the Contact component working properly
						if(this.$route.meta.selectedGroup === GROUP_ALL_OCM_INVITES) {
							this.selectedGroup = GROUP_ALL_OCM_INVITES
						}
						// get OCM invites
						this.$store.dispatch('fetchOcmInvites').then(() => {
							this.loadingInvites = false
						})
					}
				}).then(() => {
					if (this.inviteToken !== "" && this.inviteProvider !== "") {
						this.showInviteAcceptDialog = true
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
			const userGroupStore = useUserGroupStore()
			this.$store.dispatch('getCircles')
				.then(userGroupStore.getUserGroups(getCurrentUser().uid))
				.then(() => {
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

			const contact = new Contact(
				`
				BEGIN:VCARD
				VERSION:4.0
				PRODID:-//Nextcloud Contacts v${appVersion}
				END:VCARD
			`.trim().replace(/\t/gm, ''),
				this.defaultAddressbook,
			)

			contact.fullName = t('contacts', 'Name')

			contact.rev = ICAL.Time.fromJSDate(new Date(), true)

			// iterate over all properties (filter is not usable on objects and we need the key of the property)
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

			// reset to default group if 'New contact' is triggered from within the OCM invites view 
			const group = this.isInvitesView ? GROUP_ALL_CONTACTS : this.selectedGroup

			// set group if it's selected already
			// BUT NOT if it's the _fake_ groups like all contacts and not grouped
			if ([GROUP_ALL_CONTACTS, GROUP_NO_GROUP_CONTACTS].indexOf(group) === -1) {
				contact.groups = [group]
			}
			try {
				// this will trigger the proper commits to groups, contacts and addressbook
				await this.$store.dispatch('addContact', contact)
				await this.$router.push({
					name: 'contact',
					params: {
						selectedGroup: group,
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
				.map((addressbook) => {
					if (!addressbook.enabled) {
						return Promise.resolve()
					}
					return this.$store.dispatch('getContactsFromAddressBook', { addressbook })
				})).then(() => {
				this.loadingContacts = false
				if (!this.isMobile && !this.selectedChart) {
					this.$route.name === ROUTE_NAME_OCM_INVITE || this.$route.name === ROUTE_NAME_ALL_OCM_INVITES ? this.selectFirstOcmInviteIfNone() : this.selectFirstContactIfNone()
				}
			})
		},

		fetchOcmInvites() {
			this.$store.dispatch('fetchOcmInvites')
			this.loadingInvites = false
		},

		manualInviteAccept() {
			this.showManualInvite = true
		},
		manualInviteCancel() {
			this.showManualInvite = false
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

			const inList = this.contactsList.findIndex((contact) => contact.key === this.selectedContact) > -1
			if (!this.selectedContact || !inList) {
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
					&& !this.selectedUserGroup
					&& !this.groups.find((group) => group.name === this.selectedGroup)
					&& GROUP_ALL_CONTACTS !== this.selectedGroup
					&& GROUP_NO_GROUP_CONTACTS !== this.selectedGroup
					&& ROUTE_CIRCLE !== this.selectedGroup
					&& ROUTE_USER_GROUP !== this.selectedGroup) {
					// no 'group not found' error when displaying invite accept dialog
					if(this.$route.name !== ROUTE_NAME_INVITE_ACCEPT_DIALOG) {
						showError(t('contacts', 'Group {group} not found', { group: this.selectedGroup }))
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
			}
		},
		/**
		 * Select the first OCM invite of the list if none are selected already
		 */
		selectFirstOcmInviteIfNone() {
			const inList = this.invitesList.findIndex(invite => invite.key === this.selectedInvite) > -1
			if (this.selectedInvite === undefined || !inList) {
				if (Object.keys(this.invitesList).length) {
					this.$router.push({
						name: ROUTE_NAME_OCM_INVITE,
						params: {
							selectedInvite: Object.values(this.invitesList)[0].key,
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

		/**
		 * Accept the OCM invite and redirect to the new created contact
		 */
		async acceptInvite() {
			try {
				const response = await axios.patch('/apps/contacts/ocm/invitations/' + inviteToken + '/accept', {
					provider: inviteProvider,
				})
				window.open(response.data.contact, '_self')
			} catch (error) {
				const message = error.response.data.message
				logger.error('Could not accept invite: ' + message, { error })
				showError(t('contacts', message))
			} finally {
				this.showInviteAcceptDialog = false
			}
		},
		cancelInvite() {
			this.showInviteAcceptDialog = false
		},
		newInvite() {
			this.showNewInviteForm = true
		},
		async sendNewInvite() {
			try {
				const response = await this.$store.dispatch('newOcmInvite', this.ocmInvite)
				window.open(response.data.invite, '_self')
			} catch(error) {
				this.cancelNewInvite()
				const message = error.response.data.message
				showError(t('contacts', message))
			}
		},
		cancelNewInvite() {
			this.showNewInviteForm = false
			this.ocmInvite = { email: '', message: '' }
		},
	},
}

export default _default;
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

.new-invite-form__buttons-row {
	margin-top: 1em;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	justify-content: space-between;
}
</style>
