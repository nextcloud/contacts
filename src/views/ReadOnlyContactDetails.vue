<!--
  - SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="display-contact-details">
		<div v-if="loading" class="recipient-details-loading">
			<NcLoadingIcon />
		</div>
		<!-- nothing selected or contact not found -->
		<NcEmptyContent v-else-if="!contact"
			class="empty-content"
			:name="t('mail', 'No data for this contact')"
			:description="t('mail', 'No data for this contact on their profile')">
			<template #icon>
				<IconContact :size="20" />
			</template>
		</NcEmptyContent>
		<div v-else
			class="recipient-details-content">
			<div class="contact-title">
				<h6>{{ contact.fullName }}</h6>
				<!-- Subtitle -->
				<span v-html="formattedSubtitle" />
			</div>
			<div class="contact-details-wrapper">
				<div v-for="(properties, name) in groupedProperties"
					:key="name">
					<ContactDetailsProperty v-for="(property, index) in properties"
						:key="`${index}-${contact.key}-${property.name}`"
						:is-first-property="index === 0"
						:is-last-property="index === properties.length - 1"
						:property="property"
						:contact="contact"
						:local-contact="localContact"
						:contacts="[contact]"
						:is-read-only="true"
						:bus="bus" />
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import escape from 'lodash/fp/escape.js'
import { NcEmptyContent, NcLoadingIcon } from '@nextcloud/vue'
import IconContact from 'vue-material-design-icons/AccountMultiple.vue'
import mitt from 'mitt'
import { namespaces as NS } from '@nextcloud/cdav-library'
import { loadState } from '@nextcloud/initial-state'
import ContactDetailsProperty from '../components/ContactDetails/ContactDetailsProperty.vue'
import Contact from '../models/contact.js'
import rfcProps from '../models/rfcProps.js'
import validate from '../services/validate.js'
import client from '../services/cdav.js'
import usePrincipalsStore from '../store/principals.js'
import IsMobileMixin from '../mixins/IsMobileMixin.ts'

const { profileEnabled } = loadState('user_status', 'profileEnabled', false)

export default {
	name: 'ReadOnlyContactDetails',

	components: {
		ContactDetailsProperty,
		NcEmptyContent,
		IconContact,
		NcLoadingIcon,
	},

	mixins: [IsMobileMixin],

	props: {
		contactEmailAddress: {
			type: String,
			required: true,
		},
		desc: {
			type: String,
			required: false,
			default: '',
		},
	},

	data() {
		return {
			contactDetailsSelector: '.contact-details',
			excludeFromBirthdayKey: 'x-nc-exclude-from-birthday-calendar',

			bus: mitt(),
			showMenuPopover: false,
			profileEnabled,
			contact: undefined,
			localContact: undefined,
			loading: true,
		}
	},

	computed: {
		/**
		 * Read-only representation of the contact title and organization.
		 *
		 * @return {string}
		 */
		formattedSubtitle() {
			const title = this.contact.title
			const organization = this.contact.org

			if (title && organization) {
				return t('contacts', '{title} at {organization}', {
					title,
					organization,
				})
			} else if (title) {
				return escape(title)
			} else if (organization) {
				return escape(organization)
			}

			return ''
		},
		addressbooks() {
			return this.$store.getters.getAddressbooks
		},
		/**
		 * Contact properties copied and sorted by rfcProps.fieldOrder
		 *
		 * @return {Array}
		 */
		sortedProperties() {
			if (!this.localContact || !this.localContact.properties) {
				return []
			}
			return this.localContact.properties
				.toSorted((a, b) => {
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
			if (!this.sortedProperties) {
				return {}
			}
			return this.sortedProperties.reduce((list, property) => {
				if (!this.canDisplay(property)) {
					return list
				}
				if (!list[property.name]) {
					list[property.name] = []
				}
				list[property.name].push(property)
				return list
			}, {})
		},
		/**
		 * The address book is read-only (e.g. shared with me).
		 *
		 * @return {boolean}
		 */
		addressbookIsReadOnly() {
			return this.contact.addressbook?.readOnly
		},
		/**
		 * Usable addressbook object linked to the local contact
		 *
		 * @return {string}
		 */
		addressbook() {
			return this.contact.addressbook.id
		},

		/**
		 * Fake model to use the propertyGroups component
		 *
		 * @return {object}
		 */
		groupsModel() {
			return {
				readableName: t('mail', 'Contact groups'),
				icon: 'icon-contacts-dark',
			}
		},
	},
	watch: {
		contact: {
			handler(contact) {
				this.updateLocalContact(contact)
			},
			immediate: true,
		},
	},
	async beforeMount() {
		// Init client and stores
		await client.connect({ enableCardDAV: true })
		const principalsStore = usePrincipalsStore()
		principalsStore.setCurrentUserPrincipal(client)
		await this.$store.dispatch('getAddressbooks')

		// Fetch contact
		await this.fetchContact()
	},
	methods: {
		async fetchContact() {
			try {
				const email = this.contactEmailAddress
				const result = await Promise.all(
					this.addressbooks.map(async (addressBook) => [
						addressBook.dav,
						await addressBook.dav.addressbookQuery([
							{
								name: [NS.IETF_CARDDAV, 'prop-filter'],
								attributes: [['name', 'EMAIL']],
								children: [
									{
										name: [NS.IETF_CARDDAV, 'text-match'],
										value: email,
									},
								],
							},
						]),
					]),
				)

				const contacts = result.flatMap(([addressBook, vcards]) =>
					vcards.map((vcard) => new Contact(vcard.data, addressBook)),
				)

				this.contact = contacts.find((contact) => contact.email === email)
			} catch (error) {
				console.error('Error fetching contact:', error)
			} finally {
				this.loading = false
			}
		},
		updateGroups(value) {
			this.newGroupsValue = value
		},
		/**
		 *  Update this.localContact
		 *
		 * @param {Contact} contact the contact to clone
		 */
		async updateLocalContact(contact) {
			if (!contact) {
				this.localContact = undefined
				return
			}

			// create empty contact and copy inner data
			const localContact = Object.assign(
				Object.create(Object.getPrototypeOf(contact)),
				contact,
			)
			validate(localContact)

			this.localContact = localContact
			this.newGroupsValue = [...this.localContact.groups]
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

.empty-content {
	height: 100%;
}

.contact-title {
	margin-inline-start: 100px;
	margin-top: 40px;
}

:deep(.property__value) {
	font-size: medium !important;
}

.recipient-details-loading {
	margin-top: 64px;
}
</style>
