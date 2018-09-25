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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<div id="contact-header-avatar" :class="{'maximised':maximizeAvatar }">
		<div class="contact-avatar-background" />
		<img v-if="contact.photo" :src="contact.photo"
			class="contact-header-avatar__picture"
			@click="maximise">
		<div class="avatar-options">
			<input id="contact-avatar-upload" type="file" class="hidden"
				accept="image/*" @change="processFile">
			<label v-tooltip.auto="t('contacts', 'Upload a new picture')" for="contact-avatar-upload" class="icon-upload-white" />
			<div v-if="maximizeAvatar" class="icon-delete-white" @click="removePhoto" />
			<div v-if="maximizeAvatar" class="icon-fullscreen-white" @click="minimizePhoto" />
			<div v-if="maximizeAvatar" class="icon-download-white" @click="downloadPhoto" />
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
	methods: {
		processFile(event) {
			let file = event.target.files[0]
			let reader = new FileReader()
			let self = this
			// need if contact.photo to check if already there, if it is use updatePropertyWithValue
			reader.onload = function(e) {
				self.contact.vCard.addPropertyWithValue('photo', reader.result)
				self.$store.dispatch('updateContact', self.contact)
			}
			reader.readAsDataURL(file)
		},
		toggleSize() {
			// maximise avatar photo
			this.maximizeAvatar != this.maximizeAvatar
		},
		removePhoto() {
			// self.contact.vCard.removePropertyWithValue('photo', reader.result)
			// remove avatar photo
			console.log("remove") // eslint-disable-line
		},
		downloadPhoto() {
			// download avatar photo
			// same as opening in new tab, use contact.url?photo to create download link
			// look at download addressbook
			console.log("download") // eslint-disable-line
		}
	}

}
</script>
