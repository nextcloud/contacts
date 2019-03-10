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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<div id="contact-details" class="app-content-details">
		<!-- nothing selected or contact not found -->
		<div v-if="!contact && !loading" id="emptycontent">
			<div class="icon-contacts" />
			<h2>{{ t('contacts', 'No contact selected') }}</h2>
			<p>{{ t('contacts', 'Select a contact on the list to begin') }}</p>
		</div>

		<!-- loading -->
		<div v-else-if="loading" id="emptycontent">
			<div class="icon-contacts" />
			<h2>{{ t('contacts', 'Loading') }}</h2>
		</div>

		<template v-else>
			<!-- contact header -->
			<header :style="{ 'backgroundColor': colorAvatar }">
				<!-- avatar and upload photo -->
				<contact-avatar :contact="contact" />
				<!-- QUESTION: is it better to pass contact as a prop or get it from the store inside
				contact-avatar ?  :avatar="contact.photo"-->

				<!-- fullname, org, title -->
				<div id="contact-header-infos">
					<h2>
						<input id="contact-fullname" ref="fullname" v-model="contact.fullName"
							:readonly="contact.addressbook.readOnly" :placeholder="t('contacts', 'Name')" type="text"
							autocomplete="off" autocorrect="off" spellcheck="false"
							name="fullname"
							@input="debounceUpdateContact" @click="selectInput">
					</h2>
					<div id="details-org-container">
						<input id="contact-org" v-model="contact.org" :readonly="contact.addressbook.readOnly"
							:placeholder="t('contacts', 'Company')" type="text" autocomplete="off"
							autocorrect="off" spellcheck="false" name="org"
							@input="debounceUpdateContact">
						<input id="contact-title" v-model="contact.title" :readonly="contact.addressbook.readOnly"
							:placeholder="t('contacts', 'Title')" type="text" autocomplete="off"
							autocorrect="off" spellcheck="false" name="title"
							@input="debounceUpdateContact">
					</div>
				</div>

				<!-- actions -->
				<div id="contact-header-actions">
					<a v-if="loadingUpdate || warning"
						v-tooltip.bottom="{
							content: warning ? warning.msg : '',
							trigger: 'hover focus'
						}"
						:class="{'icon-loading-small': loadingUpdate,
							[`${warning.icon}`]: warning}" class="header-icon" href="#" />
					<div v-if="conflict" v-tooltip="{
							content: conflict,
							show: true,
							trigger: 'manual',
						}" class="header-icon header-icon--pulse icon-history-force-white"
						@click="refreshContact" />
					<div class="menu-icon">
						<div v-click-outside="closeMenu" class="header-icon icon-more-white" @click="toggleMenu" />
						<div :class="{ 'open': openedMenu }" class="popovermenu">
							<popover-menu :menu="contactActions" />
						</div>
					</div>
				</div>
			</header>

			<!-- contact details loading -->
			<section v-if="loadingData" class="icon-loading contact-details" />

			<!-- contact details -->
			<section v-else class="contact-details">
				<!-- properties iteration -->
				<!-- using contact.key in the key and index as key to avoid conflicts between similar data and exact key -->
				<!-- passing the debounceUpdateContact so that the contact-property component contains the function
					and allow us to use it on the rfcProps since the scope is forwarded to the actions -->
				<contact-property v-for="(property, index) in sortedProperties" :key="`${index}-${contact.key}-${property.name}`" :index="index"
					:sorted-properties="sortedProperties" :property="property" :contact="contact"
					:update-contact="debounceUpdateContact" @updatedcontact="debounceUpdateContact" />

				<!-- addressbook change select - no last property because class is not applied here,
					empty property because this is a required prop on regular property-select. But since
					we are hijacking this... (this is supposed to be used with a ICAL.property, but to avoid code
					duplication, we created a fake propModel and property with our own options here) -->
				<property-select :prop-model="addressbookModel" :value.sync="addressbook" :is-first-property="true"
					:is-last-property="true" :property="{}" class="property--addressbooks property--last" />

				<!-- Groups always visible -->
				<property-groups :prop-model="groupsModel" :value.sync="groups" :contact="contact"
					:is-read-only="isReadOnly" class="property--groups property--last" />

				<!-- Last modified-->
				<property-rev v-if="contact.rev" :value="contact.rev" />

				<!-- new property select -->
				<add-new-prop v-if="!isReadOnly" :contact="contact" />
			</section>
		</template>
	</div>
</template>

<script>
import debounce from 'debounce'
import PQueue from 'p-queue'

import rfcProps from 'Models/rfcProps'
import validate from 'Services/validate'

import ContactProperty from './ContactDetails/ContactDetailsProperty'
import AddNewProp from './ContactDetails/ContactDetailsAddNewProp'
import PropertySelect from './Properties/PropertySelect'
import PropertyGroups from './Properties/PropertyGroups'
import PropertyRev from './Properties/PropertyRev'
import ContactAvatar from './ContactDetails/ContactDetailsAvatar'

const updateQueue = new PQueue({ concurrency: 1 })

export default {
	name: 'ContactDetails',

	components: {
		ContactProperty,
		PropertySelect,
		PropertyGroups,
		PropertyRev,
		AddNewProp,
		ContactAvatar
	},

	props: {
		loading: {
			type: Boolean,
			default: true
		},
		contactKey: {
			type: String,
			default: undefined
		}
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
			openedMenu: false
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
		 * @returns {Object|boolean}
		 */
		warning() {
			if (!this.contact.dav) {
				return {
					icon: 'icon-error-white header-icon--pulse',
					msg: t('contacts', 'This contact is not yet synced. Edit it to save it to the server.')
				}
			} else if (this.isReadOnly) {
				return {
					icon: 'icon-eye-white',
					msg: t('contacts', 'This contact is in read-only mode. You do not have permission to edit this contact.')
				}
			}
			return false
		},

		/**
		 * Conflict message
		 *
		 * @returns {string|boolean}
		 */
		conflict() {
			if (this.contact.conflict) {
				return t('contacts', 'The contact you were trying to edit has changed. Please manually refresh the contact. Any further edits will be discarded.')
			}
			return false
		},

		/**
		 * Contact color based on uid
		 *
		 * @returns {string}
		 */
		colorAvatar() {
			try {
				let color = this.contact.uid.toRgb()
				return `rgb(${color.r}, ${color.g}, ${color.b})`
			} catch (e) {
				return 'grey'
			}
		},

		/**
		 * Header actions for the contact
		 *
		 * @returns {Array}
		 */
		contactActions() {
			let actions = [
				{
					icon: 'icon-download',
					text: t('contacts', 'Download'),
					href: this.contact.url
				}
			]
			if (!this.contact.addressbook.readOnly) {
				actions.push({
					icon: 'icon-delete',
					text: t('contacts', 'Delete'),
					action: this.deleteContact
				})
			}

			return actions
		},

		/**
		 * Contact properties copied and sorted by rfcProps.fieldOrder
		 *
		 * @returns {Array}
		 */
		sortedProperties() {
			return this.localContact.properties.slice(0).sort((a, b) => {
				return (
					rfcProps.fieldOrder.indexOf(a.name) - rfcProps.fieldOrder.indexOf(b.name)
				)
			})
		},

		/**
		 * Fake model to use the propertySelect component
		 *
		 * @returns {Object}
		 */
		addressbookModel() {
			return {
				readableName: t('contacts', 'Addressbook'),
				icon: 'icon-address-book',
				options: this.addressbooksOptions
			}
		},

		/**
		 * Usable addressbook object linked to the local contact
		 *
		 * @param {string} [addressbookId] set the addressbook id
		 * @returns {string}
		 */
		addressbook: {
			get: function() {
				return this.contact.addressbook.id
			},
			set: function(addressbookId) {
				this.moveContactToAddressbook(addressbookId)
			}
		},

		/**
		 * Fake model to use the propertyGroups component
		 *
		 * @returns {Object}
		 */
		groupsModel() {
			return {
				readableName: t('contacts', 'Groups'),
				icon: 'icon-contacts'
			}
		},

		/**
		 * Usable groups object linked to the local contact
		 *
		 * @param {string[]} data An array of groups
		 * @returns {Array}
		 */
		groups: {
			get: function() {
				return this.contact.groups
			},
			set: function(data) {
				this.contact.groups = data
				this.debounceUpdateContact()
			}
		},

		/**
		 * Store getters filtered and mapped to usable object
		 *
		 * @returns {Array}
		 */
		addressbooksOptions() {
			return this.addressbooks
				.filter(addressbook => !addressbook.readOnly && addressbook.enabled)
				.map(addressbook => {
					return {
						id: addressbook.id,
						name: addressbook.displayName
					}
				})
		},

		// store getter
		addressbooks() {
			return this.$store.getters.getAddressbooks
		},
		contact() {
			return this.$store.getters.getContact(this.contactKey)
		}
	},

	watch: {
		contact: function() {
			if (this.contactKey) {
				this.selectContact(this.contactKey)
			}
		}
	},

	beforeMount() {
		// load the desired data if we already selected a contact
		if (this.contactKey) {
			this.selectContact(this.contactKey)
		}
	},

	methods: {
		/**
		 * Executed on the 'updatedcontact' event
		 * Send the local clone of contact to the store
		 */
		async updateContact() {
			this.fixed = false
			this.loadingUpdate = true
			await this.$store.dispatch('updateContact', this.localContact)
			this.loadingUpdate = false
		},

		/**
		 * Debounce the contact update for the header props
		 * photo, fn, org, title
		 */
		debounceUpdateContact: debounce(function(e) {
			updateQueue.add(this.updateContact)
		}, 500),

		// menu handling
		closeMenu() {
			this.openedMenu = false
		},
		toggleMenu() {
			this.openedMenu = !this.openedMenu
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
		 * Select a contac, and update the localContact
		 * Fetch updated data if necessary
		 * Scroll to the selected contact if exists
		 *
		 * @param {string} key the contact key
		 */
		async selectContact(key) {
			// local version of the contact
			this.loadingData = true
			let contact = this.$store.getters.getContact(key)

			if (contact) {
				// if contact exists AND if exists on server
				if (contact.dav) {
					try {
						await this.$store.dispatch('fetchFullContact', { contact })

						// create empty contact and copy inner data
						let localContact = Object.assign(
							Object.create(Object.getPrototypeOf(contact)),
							contact
						)

						this.fixed = validate(localContact)

						this.localContact = localContact
						this.loadingData = false
					} catch (error) {
						if (error.name === 'ParserError') {
							OC.Notification.showTemporary(t('contacts', 'Syntax error. Cannot open the contact.'))
						} else if (error.status === 404) {
							OC.Notification.showTemporary(t('contacts', `The contact doesn't exists anymore on the server.`))
						} else {
							OC.Notification.showTemporary(t('contacts', `Unable to retrieve the contact from the server, please check your network connection.`))
						}
						console.error(error)
						// trigger a local deletion from the store only
						this.$store.dispatch('deleteContact', { contact: this.contact, dav: false })
					}
				} else {
					// create empty contact and copy inner data
					// wait for an update to really push the contact on the server!
					let localContact = Object.assign(
						Object.create(Object.getPrototypeOf(contact)),
						contact
					)

					this.fixed = validate(localContact)

					this.localContact = localContact
					this.loadingData = false
				}

				// scroll to selected contact if any
				let list = document.getElementById('contacts-list')
				let item = document.querySelector('#' + btoa(contact.key).slice(0, -2))
				let isAbove = list.scrollTop > item.offsetTop
				let isUnder = item.offsetTop + item.offsetHeight > list.scrollTop + list.offsetHeight
				// check if contact outside visible list area
				if (item && (isAbove || isUnder)) {
					list.scrollTo(0, item.offsetTop - item.offsetHeight / 2)
				}
			}
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
			let addressbook = this.addressbooks.find(search => search.id === addressbookId)
			this.loadingUpdate = true
			if (addressbook) {
				try {
					const contact = await this.$store.dispatch('moveContactToAddressbook', {
						// we need to use the store contact, not the local contact
						// using this.contact and not this.localContact
						contact: this.contact,
						addressbook
					})
					// select the contact again
					this.$router.push({
						name: 'contact',
						params: {
							selectedGroup: this.$route.params.selectedGroup,
							selectedContact: contact.key
						}
					})
				} catch (error) {
					console.error(error)
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
		}
	}
}
</script>
