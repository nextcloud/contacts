<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Richard Steinmetz <richard@steinmetz.cloud>
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
	<AppContentDetails>
		<!-- nothing selected or contact not found -->
		<EmptyContent v-if="!contact"
			:title="t('contacts', 'No contact selected')"
			:description="t('contacts', 'Select a contact on the list to begin')">
			<template #icon>
				<IconContact :size="20" />
			</template>
		</EmptyContent>

		<template v-else>
			<!-- contact header -->
			<DetailsHeader>
				<!-- avatar and upload photo -->
				<ContactAvatar slot="avatar"
					:contact="contact"
					@update-local-contact="updateLocalContact" />

				<!-- fullname -->
				<input id="contact-fullname"
					slot="title"
					ref="fullname"
					v-model="contact.fullName"
					:readonly="contact.addressbook.readOnly"
					:placeholder="t('contacts', 'Name')"
					type="text"
					autocomplete="off"
					autocorrect="off"
					spellcheck="false"
					name="fullname"
					@input="debounceUpdateContact"
					@click="selectInput">

				<!-- org, title -->
				<template #subtitle>
					<input id="contact-org"
						v-model="contact.org"
						:readonly="contact.addressbook.readOnly"
						:placeholder="t('contacts', 'Company')"
						type="text"
						autocomplete="off"
						autocorrect="off"
						spellcheck="false"
						name="org"
						@input="debounceUpdateContact">
					<input id="contact-title"
						v-model="contact.title"
						:readonly="contact.addressbook.readOnly"
						:placeholder="t('contacts', 'Title')"
						type="text"
						autocomplete="off"
						autocorrect="off"
						spellcheck="false"
						name="title"
						@input="debounceUpdateContact">
				</template>

				<!-- actions -->
				<template #actions>
					<!-- warning message -->
					<a v-if="loadingUpdate || warning"
						v-tooltip.bottom="{
							content: warning ? warning.msg : '',
							trigger: 'hover focus'
						}"
						:class="{'icon-loading-small': loadingUpdate,
							[`${warning.icon}`]: warning}"
						class="header-icon"
						@click="onWarningClick" />

					<!-- conflict message -->
					<div v-if="conflict"
						v-tooltip="{
							content: conflict,
							show: true,
							trigger: 'manual',
						}"
						class="header-icon header-icon--pulse icon-history"
						@click="refreshContact" />

					<!-- repaired contact message -->
					<div v-if="fixed"
						v-tooltip="{
							content: t('contacts', 'This contact was broken and received a fix. Please review the content and click here to save it.'),
							show: true,
							trigger: 'manual',
						}"
						class="header-icon header-icon--pulse icon-up"
						@click="updateContact" />
				</template>

				<!-- menu actions -->
				<template #actions-menu>
					<ActionLink :href="contact.url"
						:download="`${contact.displayName}.vcf`">
						<template #icon>
							<IconDownload :size="20" />
						</template>
						{{ t('contacts', 'Download') }}
					</ActionLink>
					<!-- user can clone if there is at least one option available -->
					<ActionButton v-if="isReadOnly && addressbooksOptions.length > 0"
						ref="cloneAction"
						:close-after-click="true"
						@click="cloneContact">
						<template #icon>
							<IconCopy :size="20" />
						</template>
						{{ t('contacts', 'Clone contact') }}
					</ActionButton>
					<ActionButton :close-after-click="true" @click="showQRcode">
						<template #icon>
							<IconQr :size="20" />
						</template>
						{{ t('contacts', 'Generate QR Code') }}
					</ActionButton>
					<ActionButton v-if="enableToggleBirthdayExclusion"
						:close-after-click="true"
						@click="toggleBirthdayExclusionForContact">
						<template #icon>
							<CakeIcon :size="20" />
						</template>
						{{ excludeFromBirthdayLabel }}
					</ActionButton>
					<ActionButton v-if="!isReadOnly" @click="deleteContact">
						<template #icon>
							<IconDelete :size="20" />
						</template>
						{{ t('contacts', 'Delete') }}
					</ActionButton>
				</template>
			</DetailsHeader>

			<!-- qrcode -->
			<Modal v-if="qrcode"
				id="qrcode-modal"
				size="small"
				:clear-view-delay="-1"
				:title="contact.displayName"
				@close="closeQrModal">
				<img :src="`data:image/svg+xml;base64,${qrcode}`"
					:alt="t('contacts', 'Contact vCard as QR code')"
					class="qrcode"
					width="400">
			</Modal>

			<!-- pick addressbook when cloning contact -->
			<Modal v-if="showPickAddressbookModal"
				id="pick-addressbook-modal"
				:clear-view-delay="-1"
				:title="t('contacts', 'Pick an address book')"
				@close="closePickAddressbookModal">
				<Multiselect ref="pickAddressbook"
					v-model="pickedAddressbook"
					:allow-empty="false"
					:options="addressbooksOptions"
					:placeholder="t('contacts', 'Select address book')"
					track-by="id"
					label="name" />
				<button @click="closePickAddressbookModal">
					{{ t('contacts', 'Cancel') }}
				</button>
				<button class="primary" @click="cloneContact">
					{{ t('contacts', 'Clone contact') }}
				</button>
			</Modal>

			<!-- contact details loading -->
			<IconLoading v-if="loadingData" :size="20" class="contact-details" />

			<!-- contact details -->
			<section v-else class="contact-details">
				<!-- properties iteration -->
				<!-- using contact.key in the key and index as key to avoid conflicts between similar data and exact key -->
				<!-- passing the debounceUpdateContact so that the contact-property component contains the function
					and allow us to use it on the rfcProps since the scope is forwarded to the actions -->
				<div v-for="(properties, name) in groupedProperties"
					:key="name">
					<ContactDetailsProperty v-for="(property, index) in properties"
						:key="`${index}-${contact.key}-${property.name}`"
						:is-first-property="index===0"
						:is-last-property="index === properties.length - 1"
						:property="property"
						:contact="contact"
						:local-contact="localContact"
						:update-contact="debounceUpdateContact"
						:contacts="contacts"
						:bus="bus" />
				</div>

				<!-- addressbook change select - no last property because class is not applied here,
					empty property because this is a required prop on regular property-select. But since
					we are hijacking this... (this is supposed to be used with a ICAL.property, but to avoid code
					duplication, we created a fake propModel and property with our own options here) -->
				<PropertySelect :prop-model="addressbookModel"
					:options="addressbooksOptions"
					:value.sync="addressbook"
					:is-first-property="true"
					:is-last-property="true"
					:property="{}"
					:hide-actions="true"
					class="property--addressbooks property--last" />

				<!-- Groups always visible -->
				<PropertyGroups :prop-model="groupsModel"
					:value.sync="groups"
					:contact="contact"
					:is-read-only="isReadOnly"
					class="property--groups property--last" />

				<!-- new property select -->
				<AddNewProp v-if="!isReadOnly"
					:bus="bus"
					:contact="contact" />

				<!-- Last modified-->
				<PropertyRev v-if="contact.rev" :value="contact.rev" />
			</section>
		</template>
	</AppContentDetails>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import { stringify } from 'ical.js'
import debounce from 'debounce'
// eslint-disable-next-line import/no-unresolved, n/no-missing-import
import PQueue from 'p-queue'
import qr from 'qr-image'
import Vue from 'vue'

import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton.js'
import ActionLink from '@nextcloud/vue/dist/Components/NcActionLink.js'
import AppContentDetails from '@nextcloud/vue/dist/Components/NcAppContentDetails.js'
import EmptyContent from '@nextcloud/vue/dist/Components/NcEmptyContent.js'
import IconContact from 'vue-material-design-icons/AccountMultiple.vue'
import Modal from '@nextcloud/vue/dist/Components/NcModal.js'
import Multiselect from '@nextcloud/vue/dist/Components/NcMultiselect.js'
import IconLoading from '@nextcloud/vue/dist/Components/NcLoadingIcon.js'
import IconDownload from 'vue-material-design-icons/Download.vue'
import IconDelete from 'vue-material-design-icons/Delete.vue'
import IconQr from 'vue-material-design-icons/Qrcode.vue'
import CakeIcon from 'vue-material-design-icons/Cake.vue'
import IconCopy from 'vue-material-design-icons/ContentCopy.vue'

import rfcProps from '../models/rfcProps.js'
import validate from '../services/validate.js'

import AddNewProp from './ContactDetails/ContactDetailsAddNewProp.vue'
import ContactAvatar from './ContactDetails/ContactDetailsAvatar.vue'
import ContactDetailsProperty from './ContactDetails/ContactDetailsProperty.vue'
import DetailsHeader from './DetailsHeader.vue'
import PropertyGroups from './Properties/PropertyGroups.vue'
import PropertyRev from './Properties/PropertyRev.vue'
import PropertySelect from './Properties/PropertySelect.vue'

const updateQueue = new PQueue({ concurrency: 1 })

export default {
	name: 'ContactDetails',

	components: {
		ActionButton,
		ActionLink,
		AddNewProp,
		AppContentDetails,
		ContactAvatar,
		ContactDetailsProperty,
		DetailsHeader,
		EmptyContent,
		IconContact,
		IconDownload,
		IconDelete,
		IconQr,
		CakeIcon,
		IconCopy,
		IconLoading,
		Modal,
		Multiselect,
		PropertyGroups,
		PropertyRev,
		PropertySelect,
	},

	props: {
		contactKey: {
			type: String,
			default: undefined,
		},
		contacts: {
			type: Array,
			default: () => [],
		},
	},

	data() {
		return {
			// if true, the local contact have been fixed and requires a push
			fixed: false,
			/**
			 * Local off-store clone of the selected contact for edition
			 * because we can't edit contacts data outside the store.
			 * Every change will be dispatched and updated on the real
			 * store contact after a debounce.
			 */
			localContact: undefined,
			loadingData: true,
			loadingUpdate: false,
			openedMenu: false,
			qrcode: '',
			showPickAddressbookModal: false,
			pickedAddressbook: null,

			contactDetailsSelector: '.contact-details',
			excludeFromBirthdayKey: 'x-nc-exclude-from-birthday-calendar',

			// communication for ContactDetailsAddNewProp and ContactDetailsProperty
			bus: new Vue(),
		}
	},

	computed: {
		isReadOnly() {
			if (this.contact.addressbook) {
				return this.contact.addressbook.readOnly
			}
			return false
		},

		/**
		 * Warning messages
		 *
		 * @return {object | boolean}
		 */
		warning() {
			if (!this.contact.dav) {
				return {
					icon: 'icon-error header-icon--pulse',
					msg: t('contacts', 'This contact is not yet synced. Edit it to save it to the server.'),
				}
			} else if (this.isReadOnly) {
				return {
					icon: 'icon-eye',
					msg: t('contacts', 'This contact is in read-only mode. You do not have permission to edit this contact.'),
				}
			}
			return false
		},

		/**
		 * Conflict message
		 *
		 * @return {string|boolean}
		 */
		conflict() {
			if (this.contact.conflict) {
				return t('contacts', 'The contact you were trying to edit has changed. Please manually refresh the contact. Any further edits will be discarded.')
			}
			return false
		},

		/**
		 * Contact properties copied and sorted by rfcProps.fieldOrder
		 *
		 * @return {Array}
		 */
		sortedProperties() {
			return this.localContact.properties
				.slice(0)
				.sort((a, b) => {
					const nameA = a.name.split('.').pop()
					const nameB = b.name.split('.').pop()
					return rfcProps.fieldOrder.indexOf(nameA) - rfcProps.fieldOrder.indexOf(nameB)
				})
		},

		/**
		 * Contact properties filtered and grouped by rfcProps.fieldOrder
		 *
		 * @return {object}
		 */
		groupedProperties() {
			return this.sortedProperties
				.reduce((list, property) => {
					// If there is no component to display this prop, ignore it
					if (!this.canDisplay(property)) {
						return list
					}

					// Init if needed
					if (!list[property.name]) {
						list[property.name] = []
					}

					list[property.name].push(property)
					return list
				}, {})
		},

		/**
		 * Fake model to use the propertySelect component
		 *
		 * @return {object}
		 */
		addressbookModel() {
			return {
				readableName: t('contacts', 'Address book'),
				icon: 'icon-address-book',
				options: this.addressbooksOptions,
			}
		},

		/**
		 * Usable addressbook object linked to the local contact
		 *
		 * @param {string} [addressbookId] set the addressbook id
		 * @return {string}
		 */
		addressbook: {
			get() {
				return this.contact.addressbook.id
			},
			set(addressbookId) {
				// Only move when the address book actually changed to prevent a conflict.
				if (this.contact.addressbook.id !== addressbookId) {
					this.moveContactToAddressbook(addressbookId)
				}
			},
		},

		/**
		 * Fake model to use the propertyGroups component
		 *
		 * @return {object}
		 */
		groupsModel() {
			return {
				readableName: t('contacts', 'Contact groups'),
				icon: 'icon-contacts-dark',
			}
		},

		/**
		 * Usable groups object linked to the local contact
		 *
		 * @param {string[]} data An array of groups
		 * @return {Array}
		 */
		groups: {
			get() {
				return this.contact.groups
			},
			set(data) {
				this.contact.groups = data
				this.debounceUpdateContact()
			},
		},

		/**
		 * Store getters filtered and mapped to usable object
		 * This is the list of addressbooks that are available to write
		 *
		 * @return {{id: string, name: string}[]}
		 */
		addressbooksOptions() {
			return this.addressbooks
				.filter(addressbook => !addressbook.readOnly && addressbook.enabled)
				.map(addressbook => {
					return {
						id: addressbook.id,
						name: addressbook.displayName,
					}
				})
		},

		// store getter
		addressbooks() {
			return this.$store.getters.getAddressbooks
		},
		contact() {
			return this.$store.getters.getContact(this.contactKey)
		},

		excludeFromBirthdayLabel() {
			return this.localContact.vCard.hasProperty(this.excludeFromBirthdayKey)
				? t('contacts', 'Add contact to Birthday Calendar')
				: t('contacts', 'Exclude contact from Birthday Calendar')
		},

		enableToggleBirthdayExclusion() {
			return parseInt(OC.config.version.split('.')[0]) >= 26
		},
	},

	watch: {
		contact(newContact, oldContact) {
			if (this.contactKey && newContact !== oldContact) {
				this.selectContact(this.contactKey)
			}
		},
	},

	beforeMount() {
		// load the desired data if we already selected a contact
		if (this.contactKey) {
			this.selectContact(this.contactKey)
		}

		// capture ctrl+s
		document.addEventListener('keydown', this.onCtrlSave)
	},

	beforeDestroy() {
		// unbind capture ctrl+s
		document.removeEventListener('keydown', this.onCtrlSave)
	},

	methods: {
		/**
		 * Send the local clone of contact to the store
		 */
		async updateContact() {
			this.fixed = false
			this.loadingUpdate = true
			await this.$store.dispatch('updateContact', this.localContact)
			this.loadingUpdate = false

			// if we just created the contact, we need to force update the
			// localContact to match the proper store contact
			if (!this.localContact.dav) {
				this.logger.debug('New contact synced!', { localContact: this.localContact })
				// fetching newly created & storred contact
				const contact = this.$store.getters.getContact(this.localContact.key)
				await this.updateLocalContact(contact)
			}
		},

		/**
		 * Debounce the contact update for the header props
		 * photo, fn, org, title
		 */
		debounceUpdateContact: debounce(function(e) {
			updateQueue.add(this.updateContact)
		}, 500),

		/**
		 * Generate a qrcode for the contact
		 */
		showQRcode() {
			const jCal = this.contact.jCal.slice(0)
			// do not encode photo
			jCal[1] = jCal[1].filter(props => props[0] !== 'photo')

			const data = stringify(jCal)
			if (data.length > 0) {
				this.qrcode = btoa(qr.imageSync(data, { type: 'svg' }))
			}
		},

		async toggleBirthdayExclusionForContact() {
			if (!this.localContact.vCard.hasProperty(this.excludeFromBirthdayKey)) {
				this.localContact.vCard.addPropertyWithValue(this.excludeFromBirthdayKey, true)
			} else {
				this.localContact.vCard.removeProperty(this.excludeFromBirthdayKey)
			}

			await this.updateContact()
		},

		/**
		 * Select the text in the input if it is still set to 'new Contact'
		 */
		selectInput() {
			if (this.$refs.fullname && this.$refs.fullname.value === t('contacts', 'New contact')) {
				this.$refs.fullname.select()
			}
		},

		/**
		 * Select a contact, and update the localContact
		 * Fetch updated data if necessary
		 * Scroll to the selected contact if exists
		 *
		 * @param {string} key the contact key
		 */
		async selectContact(key) {
			this.loadingData = true

			// local version of the contact
			const contact = this.$store.getters.getContact(key)

			if (contact) {
				// if contact exists AND if exists on server
				if (contact.dav) {
					try {
						await this.$store.dispatch('fetchFullContact', { contact })
						// clone to a local editable variable
						await this.updateLocalContact(contact)
					} catch (error) {
						if (error.name === 'ParserError') {
							showError(t('contacts', 'Syntax error. Cannot open the contact.'))
						} else if (error?.status === 404) {
							showError(t('contacts', 'The contact does not exist on the server anymore.'))
						} else {
							showError(t('contacts', 'Unable to retrieve the contact from the server, please check your network connection.'))
						}
						console.error(error)
						// trigger a local deletion from the store only
						this.$store.dispatch('deleteContact', { contact: this.contact, dav: false })
					}
				} else {
					// clone to a local editable variable
					await this.updateLocalContact(contact)
				}
			}

			this.loadingData = false
		},

		/**
		 * Dispatch contact deletion request
		 */
		deleteContact() {
			this.$store.dispatch('deleteContact', { contact: this.contact })
		},

		/**
		 * Move contact to the specified addressbook
		 *
		 * @param {string} addressbookId the desired addressbook ID
		 */
		async moveContactToAddressbook(addressbookId) {
			const addressbook = this.addressbooks.find(search => search.id === addressbookId)
			this.loadingUpdate = true
			if (addressbook) {
				try {
					const contact = await this.$store.dispatch('moveContactToAddressbook', {
						// we need to use the store contact, not the local contact
						// using this.contact and not this.localContact
						contact: this.contact,
						addressbook,
					})
					// select the contact again
					this.$router.push({
						name: 'contact',
						params: {
							selectedGroup: this.$route.params.selectedGroup,
							selectedContact: contact.key,
						},
					})
				} catch (error) {
					console.error(error)
					showError(t('contacts', 'An error occurred while trying to move the contact'))
				} finally {
					this.loadingUpdate = false
				}
			}
		},

		/**
		 * Copy contact to the specified addressbook
		 *
		 * @param {string} addressbookId the desired addressbook ID
		 */
		async copyContactToAddressbook(addressbookId) {
			const addressbook = this.addressbooks.find(search => search.id === addressbookId)
			this.loadingUpdate = true
			if (addressbook) {
				try {
					const contact = await this.$store.dispatch('copyContactToAddressbook', {
						// we need to use the store contact, not the local contact
						// using this.contact and not this.localContact
						contact: this.contact,
						addressbook,
					})
					// select the contact again
					this.$router.push({
						name: 'contact',
						params: {
							selectedGroup: this.$route.params.selectedGroup,
							selectedContact: contact.key,
						},
					})
				} catch (error) {
					console.error(error)
					showError(t('contacts', 'An error occurred while trying to copy the contact'))
				} finally {
					this.loadingUpdate = false
				}
			}
		},

		/**
		 * Refresh the data of a contact
		 */
		refreshContact() {
			this.$store.dispatch('fetchFullContact', { contact: this.contact, etag: this.conflict })
				.then(() => {
					this.contact.conflict = false
				})
		},

		// reset the current qrcode
		closeQrModal() {
			this.qrcode = ''
		},

		/**
		 *  Update this.localContact and set this.fixed
		 *
		 * @param {Contact} contact the contact to clone
		 */
		async updateLocalContact(contact) {
			// create empty contact and copy inner data
			const localContact = Object.assign(
				Object.create(Object.getPrototypeOf(contact)),
				contact
			)

			this.fixed = validate(localContact)

			this.localContact = localContact
		},

		onCtrlSave(e) {
			if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
				e.preventDefault()
				this.debounceUpdateContact()
			}
		},

		/**
		 * Clone the current contact to another addressbook
		 */
		async cloneContact() {
			// only one addressbook, let's clone it there
			if (this.pickedAddressbook && this.addressbooks.find(addressbook => addressbook.id === this.pickedAddressbook.id)) {
				this.logger.debug('Cloning contact to', { name: this.pickedAddressbook.name })
				await this.copyContactToAddressbook(this.pickedAddressbook.id)
				this.closePickAddressbookModal()
			} else if (this.addressbooksOptions.length === 1) {
				this.logger.debug('Cloning contact to', { name: this.addressbooksOptions[0].name })
				await this.copyContactToAddressbook(this.addressbooksOptions[0].id)
			} else {
				this.showPickAddressbookModal = true
			}
		},

		closePickAddressbookModal() {
			this.showPickAddressbookModal = false
			this.pickedAddressbook = null
		},

		/**
		 * The user clicked the warning icon
		 */
		onWarningClick() {
			// if the user clicked the readonly icon, let's focus the clone button
			if (this.isReadOnly && this.addressbooksOptions.length > 0) {
				this.openedMenu = true
				this.$nextTick(() => {
					// focus the clone button
					this.$refs.actions.onMouseFocusAction({ target: this.$refs.cloneAction.$el })
				})
			}
		},

		/**
		 * Should display the property
		 *
		 * @param {Property} property the property to check
		 * @return {boolean}
		 */
		canDisplay(property) {
			// Make sure we have some model for the property and check for ITEM.PROP custom label format
			const propModel = rfcProps.properties[property.name.split('.').pop()]

			const propType = propModel && propModel.force
				? propModel.force
				: property.getDefaultType()

			return propModel && propType !== 'unknown'
		},
	},
}
</script>

<style lang="scss" scoped>
// List of all properties
section.contact-details {
	display: flex;
	flex-direction: column;
	gap: 40px;

	.property--rev {
		position: absolute;
		left: 125px;
		bottom: -25px;
		height: 44px;
		opacity: .5;
		color: var(--color-text-lighter);
		line-height: 44px;
	}
}

#qrcode-modal {
	::v-deep .modal-container {
		display: flex;
		padding: 10px;
		background-color: #fff;
		.qrcode {
			max-width: 100%;
		}
	}
}

#pick-addressbook-modal {
	::v-deep .modal-container {
		display: flex;
		overflow: visible;
		flex-wrap: wrap;
		justify-content: space-evenly;
		margin-bottom: 20px;
		padding: 10px;
		background-color: #fff;
		.multiselect {
			flex: 1 1 100%;
			width: 100%;
			margin-bottom: 20px;
		}
	}
}
</style>
