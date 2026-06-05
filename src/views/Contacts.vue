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
				<NcButton
					v-if="isOcmInvitesEnabled && !loadingInvites"
					variant="secondary"
					wide
					:disabled="!defaultAddressbook"
					@click="newInvite">
					<template #icon>
						<IconAccountSwitchOutline :size="20" />
					</template>
					{{ t('contacts', 'Invite contact') }}
				</NcButton>
				<!-- accept-invite-button -->
				<NcButton
					v-if="isOcmInvitesEnabled && !loadingInvites"
					variant="secondary"
					wide
					:disabled="!defaultAddressbook"
					@click="manualInviteAccept">
					<template #icon>
						<IconAccountArrowDownOutline :size="20" />
					</template>
					{{ t('contacts', 'Accept invite') }}
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
		<OcmInvitesContent
			v-if="isInvitesView"
			:invites-list="invitesList"
			:error-message="ocmInvitesLoadError"
			:loading="loadingInvites"
			@retry-load="fetchOcmInvites" />
		<ContactsContent
			v-else
			:contacts-list="contactsList"
			:loading="loadingContacts"
			@new-contact="newContact" />

		<!-- Import modal -->
		<Modal
			v-if="isImporting"
			:clear-view-delay="-1"
			:can-close="isImportDone"
			@close="closeImport">
			<ImportView @close="closeImport" />
		</Modal>

		<!-- new invite form -->
		<Modal
			v-if="showNewInviteForm"
			:name="t('contacts', 'Invite someone to share contacts')"
			:no-close="loadingUpdate"
			@close="cancelNewInvite">
			<OcmInviteForm v-model:ocm-invite="ocmInvite" :loading-update="loadingUpdate">
				<template #new-invite-actions>
					<div class="new-invite-form__buttons-row">
						<NcButton
							:disabled="loadingUpdate"
							data-testid="ocm-invite-new-submit-btn"
							@click="sendNewInvite">
							<template #icon>
								<IconLoading v-if="loadingUpdate" :size="20" />
								<IconCheck v-else :size="20" />
							</template>
							{{ newInvitePrimaryLabel }}
						</NcButton>
						<NcButton
							:disabled="loadingUpdate"
							data-testid="ocm-invite-new-cancel-btn"
							@click="cancelNewInvite">
							<template #icon>
								<IconLoading v-if="loadingUpdate" :size="20" />
								<IconCancel v-else :size="20" />
							</template>
							{{ t("contacts", "Cancel") }}
						</NcButton>
					</div>
				</template>
			</OcmInviteForm>
		</Modal>
		<Modal
			v-if="showManualInvite"
			:name="t('contacts', 'Accept invite')"
			:no-close="loadingUpdate"
			@close="manualInviteCancel">
			<OcmAcceptForm
				:loading-update="loadingUpdate"
				@accept="handleAccept"
				@cancel="manualInviteCancel" />
		</Modal>

		<!-- invite accept dialog -->
		<Modal
			v-if="showInviteAcceptDialog"
			:name="t('contacts', 'Accept invite')"
			:no-close="loadingUpdate"
			@close="cancelInvite">
			<OcmInviteAccept :token="inviteToken" :provider="inviteProvider">
				<template #accept-invite-actions>
					<div class="invite-accept-form__buttons-row">
						<NcButton :disabled="loadingUpdate" @click="acceptInvite">
							<template #icon>
								<IconLoading v-if="loadingUpdate" :size="20" />
								<IconCheck v-else :size="20" />
							</template>
							{{ t("contacts", "Accept") }}
						</NcButton>
						<NcButton :disabled="loadingUpdate" @click="cancelInvite">
							<template #icon>
								<IconLoading v-if="loadingUpdate" :size="20" />
								<IconCancel v-else :size="20" />
							</template>
							{{ t("contacts", "Cancel") }}
						</NcButton>
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
import axios from '@nextcloud/axios'
import { showError } from '@nextcloud/dialogs'
import { emit } from '@nextcloud/event-bus'
import { loadState } from '@nextcloud/initial-state'
import { generateUrl } from '@nextcloud/router'
import {
	NcContent as Content,
	NcLoadingIcon as IconLoading,
	NcModal as Modal,
	NcButton,
} from '@nextcloud/vue'
import ICAL from 'ical.js'
import { mapStores } from 'pinia'
import IconAccountArrowDownOutline from 'vue-material-design-icons/AccountArrowDownOutline.vue'
import IconAccountSwitchOutline from 'vue-material-design-icons/AccountSwitchOutline.vue'
import IconCancel from 'vue-material-design-icons/Cancel.vue'
import IconCheck from 'vue-material-design-icons/Check.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import ChartContent from '../components/AppContent/ChartContent.vue'
import CircleContent from '../components/AppContent/CircleContent.vue'
import ContactsContent from '../components/AppContent/ContactsContent.vue'
import OcmInvitesContent from '../components/AppContent/OcmInvitesContent.vue'
import RootNavigation from '../components/AppNavigation/RootNavigation.vue'
import SettingsImportContacts from '../components/AppNavigation/Settings/SettingsImportContacts.vue'
import ContactsPicker from '../components/EntityPicker/ContactsPicker.vue'
import OcmAcceptForm from '../components/Ocm/OcmAcceptForm.vue'
import OcmInviteAccept from '../components/Ocm/OcmInviteAccept.vue'
import OcmInviteForm from '../components/Ocm/OcmInviteForm.vue'
import ImportView from './Processing/ImportView.vue'
import IsMobileMixin from '../mixins/IsMobileMixin.ts'
import RouterMixin from '../mixins/RouterMixin.js'
import { GROUP_ALL_CONTACTS, GROUP_ALL_OCM_INVITES, GROUP_NO_GROUP_CONTACTS, ROUTE_CIRCLE, ROUTE_NAME_ALL_OCM_INVITES, ROUTE_NAME_INVITE_ACCEPT_DIALOG, ROUTE_NAME_OCM_INVITE, ROUTE_USER_GROUP } from '../models/constants.ts'
import Contact from '../models/contact.js'
import rfcProps from '../models/rfcProps.js'
import client from '../services/cdav.js'
import isCirclesEnabled from '../services/isCirclesEnabled.js'
import isOcmInvitesEnabled from '../services/isOcmInvitesEnabled.js'
import logger from '../services/logger.js'
import useOcmInvitesStore from '../store/ocminvites.ts'
import usePrincipalsStore from '../store/principals.js'
import useUserGroupStore from '../store/userGroup.ts'

const inviteToken = loadState('contacts', 'inviteToken', '')
const inviteProvider = loadState('contacts', 'inviteProvider', '')

const _default = {
	name: 'Contacts',

	components: {
		NcButton,
		IconAccountArrowDownOutline,
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
		OcmAcceptForm,
		OcmInviteAccept,
		OcmInviteForm,
		OcmInvitesContent,
		RootNavigation,
		SettingsImportContacts,
	},

	mixins: [IsMobileMixin, RouterMixin],

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
			showManualInvite: false,
			isOcmInvitesEnabled,
			inviteToken: inviteToken,
			inviteProvider: inviteProvider,
			ocmInvite: { email: '', message: '', note: '' },
			loadingUpdate: false,
			ocmInvitesConfig: loadState('contacts', 'ocmInvitesConfig', {
				optionalMail: false,
				ccSender: true,
				encodedCopyButton: false,
			}),
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
			if (
				this.selectedGroup === GROUP_ALL_CONTACTS
				|| this.$route.name === ROUTE_NAME_OCM_INVITE
				|| this.$route.name === ROUTE_NAME_ALL_OCM_INVITES
			) {
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
			return this.ocminvitesStore.sortedOcmInvites
		},

		ocmInvitesLoadError() {
			return this.ocminvitesStore.inviteListError || ''
		},

		...mapStores(useOcmInvitesStore),

		isInvitesView() {
			return (
				this.$route.name === ROUTE_NAME_OCM_INVITE
				|| this.$route.name === ROUTE_NAME_ALL_OCM_INVITES
			)
		},

		isCirclesView() {
			return this.selectedGroup === ROUTE_CIRCLE || this.selectedGroup === ROUTE_USER_GROUP
		},

		ungroupedContacts() {
			return this.sortedContacts.filter((contact) => this.contacts[contact.key].groups && this.contacts[contact.key].groups.length === 0)
		},

		/**
		 * Primary action label for the "Invite someone" modal.
		 *
		 * Reads from the parent-side `ocmInvite.sendEmail` patch the child
		 * emits via v-model. Defensive `!== false` is required because on
		 * first paint the parent's `ocmInvite` is `{ email, message, note }`
		 * (no `sendEmail` key); without the guard the label would briefly
		 * render as "Generate invite" before the child's immediate watcher
		 * emits and snaps it back to "Send invite" when email is required.
		 */
		newInvitePrimaryLabel() {
			return this.ocmInvite.sendEmail !== false
				? this.t('contacts', 'Send invite')
				: this.t('contacts', 'Generate invite')
		},
	},

	watch: {
		// watch url change and group select
		selectedGroup() {
			this.syncPrimarySelectionIfNeeded()
		},

		// watch url change and contact select
		selectedContact() {
			this.syncPrimarySelectionIfNeeded()
		},

		invitesList() {
			if (!this.isMobile && this.$route.name === ROUTE_NAME_ALL_OCM_INVITES) {
				this.selectFirstOcmInviteIfNone()
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
						this.fetchOcmInvites()
					}
				})
				.then(() => {
					if (this.inviteToken !== '') {
						if (this.inviteProvider !== '') {
							this.showInviteAcceptDialog = true
						} else {
							showError(this.t('contacts', 'This invite link is incomplete. Ask the sender to generate a new one.'))
							this.clearInviteAcceptRoute()
						}
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

			// reset to default group if 'New contact' is triggered from within the OCM invites view
			const group = this.isInvitesView
				? GROUP_ALL_CONTACTS
				: this.selectedGroup

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
					if (
						this.$route.name === ROUTE_NAME_OCM_INVITE
						|| this.$route.name === ROUTE_NAME_ALL_OCM_INVITES
					) {
						this.selectFirstOcmInviteIfNone()
					} else {
						this.selectFirstContactIfNone()
					}
				}
			})
		},

		async fetchOcmInvites() {
			this.loadingInvites = true
			try {
				await this.ocminvitesStore.fetchOcmInvites()
			} catch (error) {
				logger.error('Could not fetch OCM invites', { error })
			} finally {
				this.loadingInvites = false
			}
		},

		syncPrimarySelectionIfNeeded() {
			if (this.isMobile || this.selectedChart || this.selectedInvite) {
				return
			}
			if (this.$route.name === ROUTE_NAME_ALL_OCM_INVITES) {
				this.selectFirstOcmInviteIfNone()
				return
			}
			this.selectFirstContactIfNone()
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
			if (this.$route.name === 'import' || this.$route.name === ROUTE_NAME_INVITE_ACCEPT_DIALOG) {
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
					if (this.$route.name !== ROUTE_NAME_INVITE_ACCEPT_DIALOG) {
						showError(t('contacts', 'Group {group} not found', { group: this.selectedGroup }))
					}
					this.$router.push({ name: 'root' })
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
			const inList
				= this.invitesList.findIndex((invite) => invite.key === this.selectedInvite) > -1
			if (this.selectedInvite === undefined || !inList) {
				if (this.invitesList.length) {
					this.$router.push({
						name: ROUTE_NAME_OCM_INVITE,
						params: {
							selectedInvite: this.invitesList[0].key,
						},
					})
				} else if (this.selectedInvite !== undefined) {
					this.$router.push({
						name: ROUTE_NAME_ALL_OCM_INVITES,
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
			if (this.loadingUpdate) {
				return
			}
			this.loadingUpdate = true
			try {
				const url = generateUrl('/apps/contacts/ocm/invitations/{token}/accept', { token: this.inviteToken })
				const response = await axios.patch(url, {
					provider: this.inviteProvider,
				})
				this.showInviteAcceptDialog = false
				window.location.assign(response.data.contact)
			} catch (error) {
				const serverMessage = error?.response?.data?.message
				logger.error('Could not accept invite: ' + (serverMessage || 'unknown'), { error })
				showError(serverMessage || this.t('contacts', 'Could not accept invite'))
			} finally {
				this.loadingUpdate = false
			}
		},
		async handleAccept({ provider, token }) {
			if (this.loadingUpdate) {
				return
			}
			this.loadingUpdate = true
			try {
				const url = generateUrl('/apps/contacts/ocm/invitations/{token}/accept', { token })
				const response = await axios.patch(url, {
					provider,
				})
				this.showManualInvite = false
				window.location.assign(response.data.contact)
			} catch (error) {
				const serverMessage = error?.response?.data?.message
				logger.error('Could not accept invite: ' + (serverMessage || 'unknown'), { error })
				showError(serverMessage || this.t('contacts', 'Could not accept invite'))
			} finally {
				this.loadingUpdate = false
			}
		},
		cancelInvite() {
			this.showInviteAcceptDialog = false
			this.clearInviteAcceptRoute()
		},
		newInvite() {
			this.showNewInviteForm = true
		},
		async sendNewInvite() {
			if (this.loadingUpdate) {
				return
			}
			// Validate: when the user wants to email the invite, email must be filled.
			if (this.ocmInvite.sendEmail && !this.ocmInvite.email?.trim()) {
				showError(this.t('contacts', 'Please enter an email address.'))
				return
			}
			this.loadingUpdate = true
			try {
				const response = await this.ocminvitesStore.newOcmInvite(this.ocmInvite)
				this.cancelNewInvite()
				window.location.assign(response.data.invite)
			} catch (error) {
				const serverMessage = error?.response?.data?.message
				showError(serverMessage || this.t('contacts', 'Could not create invite'))
			} finally {
				this.loadingUpdate = false
			}
		},
		cancelNewInvite() {
			this.showNewInviteForm = false
			this.ocmInvite = { email: '', message: '', note: '' }
		},
		clearInviteAcceptRoute() {
			if (this.$route.name !== ROUTE_NAME_INVITE_ACCEPT_DIALOG) {
				return
			}
			this.$router.replace({ name: 'root' })
		},
	},
}

export default _default
</script>

<style lang="scss" scoped>
.import-and-new-contact-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--default-grid-baseline);
}

.invite-accept-form__buttons-row {
  display: flex;
  gap: calc(var(--default-grid-baseline) * 2);
  margin-top: calc(var(--default-grid-baseline) * 4);
}

.new-invite-form__buttons-row {
  margin-top: calc(var(--default-grid-baseline) * 4);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
}
</style>
