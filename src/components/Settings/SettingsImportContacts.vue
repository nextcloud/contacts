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
	- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	- GNU Affero General Public License for more details.
	-
	- You should have received a copy of the GNU Affero General Public License
	- along with this program. If not, see <http://www.gnu.org/licenses/>.
	-
-->

<template>
	<div class="import-contact">
		<template v-if="!isNoAddressbookAvailable">
			<input id="contact-import" :disabled="isImporting" type="file"
				class="hidden-visually" @change="processFile">
			<label id="upload" for="contact-import" class="button import-contact__multiselect-label icon-upload">
				{{ isImporting ? t('contacts', 'Importing into') : t('contacts', 'Import into') }}
			</label>
			<multiselect
				v-model="selectedAddressbook"
				:options="options"
				:disabled="isSingleAddressbook || isImporting"
				:placeholder="t('contacts', 'Contacts')"
				label="displayName"
				class="import-contact__multiselect" />
		</template>
		<button v-else id="upload" for="contact-import"
			class="button import-contact__multiselect-label import-contact__multiselect--no-select icon-error">
			{{ t('contacts', 'Importing is disabled because there are no address books available') }}
		</button>
	</div>
</template>

<script>
export default {
	name: 'SettingsImportContacts',

	data() {
		return {
			importDestination: false
		}
	},

	computed: {
		// getter for the store addressbooks
		addressbooks() {
			return this.$store.getters.getAddressbooks
		},
		// filter out disabled and read-only addressbooks
		availableAddressbooks() {
			return this.addressbooks
				.filter(addressbook => !addressbook.readOnly && addressbook.enabled)
		},

		// available options for the multiselect
		options() {
			return this.availableAddressbooks
				.map(addressbook => {
					return {
						id: addressbook.id,
						displayName: addressbook.displayName
					}
				})
		},
		selectedAddressbook: {
			get() {
				if (this.importDestination) {
					return this.availableAddressbooks.find(addressbook => addressbook.id === this.importDestination.id)
				}
				// default is first address book of the list
				return this.availableAddressbooks[0]
			},
			set(value) {
				this.importDestination = value
			}
		},

		// disable multiselect when there is only one address book
		isSingleAddressbook() {
			return this.options.length === 1
		},
		isNoAddressbookAvailable() {
			return this.options.length < 1
		},

		// importing state store getter
		importState() {
			return this.$store.getters.getImportState
		},
		// are we currently importing ?
		isImporting() {
			return this.importState.stage !== 'default'
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
				// reset input
				event.target.value = ''
			}
			reader.readAsText(file)
		}
	}
}
</script>
