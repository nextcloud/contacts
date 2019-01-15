<!--
import rfcProps from '../../models/rfcProps';
 * @copyright Copyright (c) 2018 Team Popcorn <teampopcornberlin@gmail.com>
 *
 * @author Team Popcorn <teampopcornberlin@gmail.com>
 *
 * @license GNU AGPL version 3 or any later version
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
	<div :class="{'maximised':maximizeAvatar }" class="contact-header-avatar">
		<div class="contact-header-avatar__wrapper">
			<div class="contact-header-avatar__background" @click="toggleSize" />
			<div v-if="contact.photo" :style="{ 'backgroundImage': `url(${photo})` }"
				class="contact-header-avatar__photo"
				@click="toggleSize" />
			<div class="contact-header-avatar__options">
				<input id="contact-avatar-upload" type="file" class="hidden"
					accept="image/*" @change="processFile">
				<label v-if="!contact.addressbook.readOnly" v-tooltip.auto="t('contacts', 'Upload a new picture')"
					for="contact-avatar-upload" class="icon-upload-white" @click="processFile" />
				<div v-if="maximizeAvatar && !contact.addressbook.readOnly" class="icon-delete-white" @click="removePhoto" />
				<a v-if="maximizeAvatar" :href="contact.url + '?photo'" class="icon-download-white" />
			</div>
		</div>
	</div>
</template>

<script>

export default {
	name: 'ContactAvatar',

	props: {
		contact: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			maximizeAvatar: false
		}
	},
	computed: {
		photo() {
			const type = this.contact.vCard.getFirstProperty('photo').type
			if (!this.contact.photo.startsWith('data') && type === 'binary') {
				// split on coma in case of any leftover base64 data and retrieve last part
				// usually we come to this part when the base64 image type is unknown
				return `data:image;base64,${this.contact.photo.split(',').pop()}`
			}
			return this.contact.photo
		}
	},
	methods: {
		/**
		 * Handler to store a new photo on the current contact
		 *
		 * @param {Object} event the event object containing the image
		 */
		processFile(event) {
			if (event.target.files) {
				let file = event.target.files[0]
				if (file.size && file.size <= 1 * 1024 * 1024) {
					let reader = new FileReader()
					let self = this
					// check if photo property exists to decide whether to add/update it
					reader.onload = function(e) {
						self.contact.photo
							? self.contact.photo = reader.result
							: self.contact.vCard.addPropertyWithValue('photo', reader.result)

						self.$store.dispatch('updateContact', self.contact)
					}
					reader.readAsDataURL(file)
				} else {
					OC.Notification.showTemporary(t('contacts', 'Image is too big (max 1MB).'))
				}
			}
		},

		/**
		 * Toggle the full image preview
		 */
		toggleSize() {
			// maximise or minimise avatar photo
			this.maximizeAvatar = !this.maximizeAvatar
		},

		/**
		 * Remove the contact's picture
		 */
		removePhoto() {
			this.contact.vCard.removeProperty('photo')
			this.maximizeAvatar = !this.maximizeAvatar
			this.$store.dispatch('updateContact', this.contact)
		}
	}

}
</script>
