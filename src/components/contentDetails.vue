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
				<div id="contact-avatar">
					<div class="contact-avatar-background" />
					<img v-if="contact.photo">
					<input id="contact-avatar-upload" type="file" class="hidden"
						accept="image/*">
					<label for="contact-avatar-upload" class="icon-upload-white" />
				</div>

				<!-- fullname, org, title -->
				<div id="contact-contact-infos" />

				<!-- actions -->
				<div id="details-actions" />
			</header>

			<!-- contact details -->
			<section>
				<input v-model="contact.uid" type="text">
			</section>
		</template>
	</div>
</template>

<script>
import Contact from '../models/contact'
import ICAL from 'ical.js'

export default {
	name: 'ContentDetails',
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
			contact: undefined
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
		}
	}

}
</script>
