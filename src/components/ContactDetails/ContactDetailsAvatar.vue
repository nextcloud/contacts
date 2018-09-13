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
		<div class="contact-avatar-background" />
		<img v-if="contact.avatar">
		<input id="contact-avatar-upload" type="file" class="hidden"
			accept="image/*" @change="processFile">
		<label v-tooltip.auto="t('contacts', 'Upload a new picture')" for="contact-avatar-upload" class="icon-upload-white" />
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
		}
	}

}
</script>
