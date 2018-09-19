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
	<div id="contact-header-avatar">
		<div class="contact-avatar-background" />
		<img v-if="contact.photo" :src="contact.photo">
		<input id="contact-avatar-upload" type="file" class="hidden"
			accept="image/*" @change="processFile">
		<label v-tooltip.auto="t('contacts', 'Upload a new picture')" for="contact-avatar-upload" class="icon-upload-white" />
	</div>
</template>

<script>
import rfcProps from '../../models/rfcProps.js'

export default {
	name: 'ContactAvatar',

	props: {
		contact: {
			type: Object,
			required: true
		}
	},
	methods: {
		processFile(event) {
			let file = event.target.files[0]
			let reader = new FileReader()
			let self = this
			reader.onload = function(e) {
				self.contact.vCard.addPropertyWithValue('photo', reader.result)
				self.$store.dispatch('updateContact', self.contact)
			}
			reader.readAsDataURL(file)
		}
	}

}
</script>
