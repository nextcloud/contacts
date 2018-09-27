
<!--
	- @copyright Copyright (c) 2018 Team Popcorn <teampopcornberlin@gmail.com>
	-
	- @author Team Popcorn <teampopcornberlin@gmail.com>
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
	<div class="import-contact">
		<input id="contact-import" type="file" class="hidden-visually"
			@change="processFile">
		<label id="upload" for="contact-import" class="button multiselect-label icon-upload no-select">
			{{ t('contacts', 'Import into') }}
		</label>
		<multiselect
			v-model="selectedAddressbook"
			:options="options"
			:disabled="isSingleAddressbook"
			:placeholder="t('contacts', 'Contacts')"
			label="displayName"
			class="multiselect-vue" />
	</div>
</template>

<script>
import clickOutside from 'vue-click-outside'
import Multiselect from 'vue-multiselect'

export default {
	name: 'SettingsImportContacts',
	components: {
		clickOutside,
		Multiselect
	},
	directives: {
		clickOutside
	},
	data() {
		return {
			importDestination: false
		}
	},
	computed: {
		addressbooks() {
			return this.$store.getters.getAddressbooks
		},
		options() {
			return this.addressbooks.map(addressbook => {
				return {
					id: addressbook.id,
					displayName: addressbook.displayName
				}
			})
		},
		importState() {
			return this.$store.getters.getImportState
		},
		selectedAddressbook: {
			get() {
				if (this.importDestination) {
					return this.addressbooks.find(addressbook => addressbook.id === this.importDestination.id)
				}
				// default is first address book of the list
				return this.addressbooks[0]
			},
			set(value) {
				this.importDestination = value
			}
		},
		// disable multiselect when there is at most one address book
		isSingleAddressbook() {
			return this.addressbooks.length <= 1
		}
	},
	methods: {
		processFile(event) {
			let file = event.target.files[0]
			let reader = new FileReader()
			let selectedAddressbook = this.selectedAddressbook
			this.$store.dispatch('changeStage', 'parsing')
			this.$store.dispatch('setAddressbook', selectedAddressbook.displayName)
			let self = this
			reader.onload = function(e) {
				self.$store.dispatch('importContactsIntoAddressbook', { vcf: reader.result, addressbook: selectedAddressbook })
			}
			reader.readAsText(file)
		}
	}
}
</script>
