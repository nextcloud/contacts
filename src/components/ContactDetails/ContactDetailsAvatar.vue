<!--
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
	<div id="contact-header-avatar">
		<div :class="{'maximized': maximizeAvatar}" class="contact-avatar-background" />
		<img v-click="maximise" v-if="contact.photo !==undefined" :id="contact.key"
			class="avatar__picture"
			src="">
		<div class="contact-header-avatar__options">
			<input id="contact-header-avatar__upload" type="file" class="hidden"
				accept="image/*"
				@change="uploadPhoto">
			<label v-tooltip.auto="t('contacts', 'Upload a new picture')" for="avatar-upload" class="icon-upload-white" />
			<div v-click="removePhoto" v-if="contact.photo !==undefined" class="icon-delete-white" />
			<div v-click="openPhoto" v-if="contact.photo !==undefined" class="icon-fullscreen-white" />
			<div v-click="downloadPhoto" v-if="contact.photo !==undefined" class="icon-download-white" />
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
	mounted: {

	},
	methods: {
		processFile(event) {
			let file = event.target.files[0]
			/* console.log(event.target.files)
			alert(JSON.stringify(file, undefined, 2))
			WIP */
			let reader = new FileReader()
			/* let selectedAddressbook = this.selectedAddressbook
			this.$store.dispatch('changeStage', 'parsing')
			this.$store.dispatch('setAddressbook', selectedAddressbook.displayName)
			WIP */
			let self = this
			reader.onload = function(e) {
				/* self.$store.dispatch('importContactsIntoAddressbook', { vcf: reader.result, addressbook: selectedAddressbook })
				WIP */
				console.log(reader.result) // eslint-disable-line
				if (!self.contact.vCard.hasProperty('avatar')) {
					let property = self.contact.vCard.addPropertyWithValue('avatar', reader.result)
					// ^WIP: need to research how to set type as 'text' same as in following example:
					// ["version", {…}, "text", "4.0", __ob__: Observer]
					property.setParameter('type', 'text')
					// ^WIP: need to research what above function is doing
					console.log(self.contact.vCard) // eslint-disable-line
				}
			}
			reader.readAsDataURL(file)
		},
		maximise() {
			// maximise avatar photo
			this.maximizeAvatar = true
		},
		uploadPhoto() {
			// upload avatar photo
		},
		removePhoto() {
			// remove avatar photo
		},
		minimizePhoto() {
			// minimize avatar photo
			this.maximizeAvatar = false
		},
		downloadPhoto() {
			// download avatar photo
		}
	}

}
</script>
