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
							value="">
					</h2>
					<div id="details-org-container">
						<input id="contact-org" v-model="contact.org" :disabled="!contact.addressbook.enabled"
							:placeholder="t('contacts', 'Company')" type="text" autocomplete="off"
							autocorrect="off" spellcheck="false" name="org"
							value="">
						<input id="contact-title" v-model="contact.title" :disabled="!contact.addressbook.enabled"
							:placeholder="t('contacts', 'Title')" type="text" autocomplete="off"
							autocorrect="off" spellcheck="false" name="title"
							value="">
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
			<section>
				<contact-details-property v-for="(property, index) in contact.properties" :key="index" :property="property" />
			</section>
		</template>
	</div>
</template>

<script>
import popoverMenu from './core/popoverMenu'
import contactDetailsProperty from './ContactDetails/ContactDetailsProperty'

import Contact from '../models/contact'

import ICAL from 'ical.js'
import ClickOutside from 'vue-click-outside'
import Vue from 'vue'
import VTooltip from 'v-tooltip'

Vue.use(VTooltip)

export default {
	name: 'ContactDetails',
	components: {
		popoverMenu,
		contactDetailsProperty
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
			contact: undefined,
			openedMenu: false
		}
	},
	computed: {
		colorAvatar() {
			try {
				let color = this.contact.uid.toRgb()
				return `rgb(${color.r}, ${color.g}, ${color.b})`
			} catch (e) {
				return 'grey'
			}
		},
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
		}
	},
	watch: {
		// url changed, get and show selected contact
		uid: function() {
			this.updateLocalContact()
		},
		// done loading, check if the provided uid is valid and open details
		loading: function() {
			if (this.uid) {
				this.updateLocalContact()
			}
		}
	},
	methods: {
		updateLocalContact() {
			// create new local instance of this contact
			let contact = this.$store.getters.getContact(this.uid)
			this.contact = new Contact(ICAL.stringify(contact.jCal), contact.addressbook)
		},
		closeMenu() {
			this.openedMenu = false
		},
		toggleMenu() {
			this.openedMenu = !this.openedMenu
		}
	}

}
</script>
