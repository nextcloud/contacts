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
	<div id="contact-details" class="app-content-details">

		<!-- nothing selected or contact not found -->
		<div v-if="!contact && !loading" id="emptycontent">
			<div class="icon-contacts" />
			<h2>{{ t('contacts', 'No contact selected') }}</h2>
			<p>{{ t('contacts', 'Select a contact on the list to begin') }}</p>
		</div>

		<!-- loading -->
		<div v-else-if="!contact && loading" id="emptycontent">
			<div class="icon-contacts" />
			<h2>{{ t('contacts', 'Loading') }}</h2>
		</div>

		<template v-else>
			<!-- contact header -->
			<header :style="{ 'backgroundColor': colorAvatar }">

				<!-- avatar and upload photo -->
				<div id="contact-header-avatar">
					<div class="contact-avatar-background" />
					<img v-if="contact.photo">
					<input id="contact-avatar-upload" type="file" class="hidden"
						accept="image/*">
					<label v-tooltip.auto="t('contacts', 'Upload a new picture')" for="contact-avatar-upload" class="icon-upload-white" />
				</div>

				<!-- fullname, org, title -->
				<div id="contact-header-infos">
					<h2>
						<input id="contact-fullname" v-model="contact.fullName" :disabled="!contact.addressbook.enabled"
							:placeholder="t('contacts', 'Name')" type="text" autocomplete="off"
							autocorrect="off" spellcheck="false" name="fullname"
							value="" @input="debounceUpdateContact">
					</h2>
					<div id="details-org-container">
						<input id="contact-org" v-model="contact.org" :disabled="!contact.addressbook.enabled"
							:placeholder="t('contacts', 'Company')" type="text" autocomplete="off"
							autocorrect="off" spellcheck="false" name="org"
							value="" @input="debounceUpdateContact">
						<input id="contact-title" v-model="contact.title" :disabled="!contact.addressbook.enabled"
							:placeholder="t('contacts', 'Title')" type="text" autocomplete="off"
							autocorrect="off" spellcheck="false" name="title"
							value="" @input="debounceUpdateContact">
					</div>
				</div>

				<!-- actions -->
				<div id="contact-header-actions">
					<div v-click-outside="closeMenu" class="menu-icon icon-more-white" @click="toggleMenu" />
					<div :class="{ 'open': openedMenu }" class="popovermenu">
						<popover-menu :menu="contactActions" />
					</div>
				</div>
			</header>

			<!-- contact details -->
			<section class="contact-details">

				<!-- properties iteration -->
				<!-- using contact.key in the key and index as key to avoid conflicts between similar data and exact key -->
				<contact-property v-for="(property, index) in sortedProperties" :key="index+contact.key" :index="index"
					:sorted-properties="sortedProperties" :property="property" :contact="contact"
					@updatedcontact="updateContact" />

				<!-- addressbook change select - no last property because class is not applied here-->
				<property-select :prop-model="addressbookModel" :value.sync="addressbook" :is-first-property="true"
					:is-last-property="false" :options="addressbooksOptions" class="property--addressbooks" />

				<!-- new property select -->
				<add-new-prop :contact="contact" />
			</section>
		</template>
	</div>
</template>

<script>
import { PopoverMenu } from 'nextcloud-vue'
import ClickOutside from 'vue-click-outside'
import Vue from 'vue'
import VTooltip from 'v-tooltip'
import debounce from 'debounce'

import Contact from '../models/contact'
import rfcProps from '../models/rfcProps.js'

import ContactProperty from './ContactDetails/ContactDetailsProperty'
import AddNewProp from './ContactDetails/ContactDetailsAddNewProp'
import PropertySelect from './Properties/PropertySelect'
import PropertyGroups from './Properties/PropertyGroups'

Vue.use(VTooltip)

export default {
	name: 'ContactDetails',

	components: {
		PopoverMenu,
		ContactProperty,
		PropertySelect,
		PropertyGroups,
		AddNewProp
	},

	directives: {
		ClickOutside
	},

	props: {
		loading: {
			type: Boolean,
			default: true
		},
		uid: {
			type: String,
			default: undefined
		}
	},

	data() {
		return {
			openedMenu: false,
			addressbookModel: {
				readableName: t('contacts', 'Addressbook'),
				icon: 'icon-addressbook'
			}
		}
	},

	computed: {
		/**
		 * Contact color based on uid
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
		 */
		contactActions() {
			let actions = [
				{
					icon: 'icon-download',
					text: t('contacts', 'Download'),
					href: this.contact.url
				}
			]
			if (this.contact.addressbook.enabled) {
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
		 */
		sortedProperties() {
			return this.contact.properties.slice(0).sort((a, b) => {
				return (
					rfcProps.fieldOrder.indexOf(a.name) -
					rfcProps.fieldOrder.indexOf(b.name)
				)
			})
		},

		// usable addressbook object linked to the local contact
		addressbook: {
			get: function() {
				return {
					id: this.contact.addressbook.id,
					name: this.contact.addressbook.displayName
				}
			},
			set: function(addressbook) {
				this.moveContactToAddressbook(addressbook)
			}
		},

		// store getters filtered and mapped to usable object
		addressbooksOptions() {
			return this.addressbooks
				.filter(addressbook => addressbook.enabled)
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

		// local version of the contact
		contact() {
			let contact = this.$store.getters.getContact(this.uid)
			if (contact) {
				// create empty contact and copy inner data
				let localContact = new Contact(
					'BEGIN:VCARD\nUID:' + contact.uid + '\nEND:VCARD',
					contact.addressbook
				)
				localContact.updateContact(contact.jCal)
				return localContact
			}
		}
	},

	methods: {
		/**
		 * Executed on the 'updatedcontact' event
		 * Send the local clone of contact to the store
		 */
		updateContact() {
			this.$store.dispatch('updateContact', this.contact)
		},

		/**
		 * Debounce the contact update for the header props
		 * photo, fn, org, title
		 */
		debounceUpdateContact: debounce(function(e) {
			this.updateContact()
		}, 500),

		// menu handling
		closeMenu() {
			this.openedMenu = false
		},
		toggleMenu() {
			this.openedMenu = !this.openedMenu
		},

		/**
		 * Dispatch contact deletion request
		 */
		deleteContact() {
			this.$store.dispatch('deleteContact', this.contact)
		},

		/**
		 * Move contact to the specified addressbook
		 *
		 * @param {Object} addressbook the desired addressbook
		 */
		moveContactToAddressbook(addressbook) {
			addressbook = this.addressbooks.find(
				search => search.id === addressbook.id
			)
			// we need to use the store contact, not the local contact
			let contact = this.$store.getters.getContact(this.contact.key)
			// TODO Make sure we do not overwrite contacts
			if (addressbook) {
				this.$store
					.dispatch('moveContactToAddressbook', {
						contact: contact,
						addressbook
					})
					.then(() => {
						this.updateContact()
					})
			}
		}
	}
}
</script>
