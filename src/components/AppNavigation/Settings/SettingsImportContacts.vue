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
			<Button class="import-contact__button-main" @click="toggleModal">
				<template #icon>
					<IconUpload :size="20" />
				</template>
				{{ t('contacts', 'Import contacts') }}
			</Button>
			<Modal v-if="isOpened"
				ref="modal"
				class="import-contact__modal"
				:title="t('contacts', 'Import contacts')"
				@close="toggleModal">
				<section class="import-contact__modal-addressbook">
					<h3>{{ t('contacts', 'Import contacts') }}</h3>
					<Multiselect v-if="!isSingleAddressbook"
						id="select-addressbook"
						v-model="selectedAddressbook"
						:allow-empty="false"
						:options="options"
						:disabled="isSingleAddressbook || isImporting"
						:placeholder="t('contacts', 'Contacts')"
						label="displayName"
						class="import-contact__multiselect">
						<template slot="singleLabel" slot-scope="{ option }">
							{{ t('contacts', 'Import into the {addressbookName} address book', { addressbookName: option.displayName }) }}
						</template>
					</Multiselect>
				</section>
				<section class="import-contact__modal-pick">
					<input id="contact-import"
						ref="contact-import-input"
						:disabled="loading || isImporting"
						type="file"
						class="hidden-visually"
						@change="processFile">
					<Button :disabled="loading"
						class="import-contact__button import-contact__button--local"
						@click="clickImportInput">
						<template #icon>
							<IconUpload :size="20" />
						</template>
						{{ t('contacts', 'Select local file') }}
					</Button>
					<Button type="primary"
						:disabled="loading"
						class="import-contact__button import-contact__button--files"
						@click="openPicker">
						<template #icon>
							<IconLoading v-if="loading" :size="20" />
							<IconFolder :size="20" />
						</template>
						<span class="import-contact__button-icon" />
						{{ t('contacts', 'Import from Files') }}
					</Button>
				</section>
			</Modal>
		</template>
		<Button v-else
			id="upload"
			for="contact-import"
			class="button import-contact__button-disabled import-contact__multiselect-label import-contact__multiselect--no-select">
			<template #icon>
				<IconError :size="20" />
			</template>
			{{ t('contacts', 'Importing is disabled because there are no address books available') }}
		</Button>
	</div>
</template>

<script>
import Button from '@nextcloud/vue/dist/Components/NcButton.js'
import Modal from '@nextcloud/vue/dist/Components/NcModal.js'
import Multiselect from '@nextcloud/vue/dist/Components/NcMultiselect.js'
import IconLoading from '@nextcloud/vue/dist/Components/NcLoadingIcon.js'
import { encodePath } from '@nextcloud/paths'
import { getCurrentUser } from '@nextcloud/auth'
import { generateRemoteUrl } from '@nextcloud/router'
import { getFilePickerBuilder } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'
import IconUpload from 'vue-material-design-icons/Upload.vue'
import IconError from 'vue-material-design-icons/AlertCircle.vue'
import IconFolder from 'vue-material-design-icons/Folder.vue'

const CancelToken = axios.CancelToken

const picker = getFilePickerBuilder(t('contacts', 'Choose a vCard file to import'))
	.setMultiSelect(false)
	.setModal(true)
	.setType(1)
	.allowDirectories(false)
	.setMimeTypeFilter('text/vcard')
	.build()

export default {
	name: 'SettingsImportContacts',

	components: {
		Button,
		Modal,
		Multiselect,
		IconUpload,
		IconError,
		IconFolder,
		IconLoading,
	},

	data() {
		return {
			cancelRequest: () => {},
			importDestination: false,
			isOpened: false,
			loading: false,
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
						displayName: addressbook.displayName,
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
			},
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
		},
	},

	async mounted() {
		// Direct import check
		if (this.$route.name === 'import') {
			const path = this.$route.query.file
			await this.processLocalFile(path)

			this.$router.push({
				name: 'group',
				params: { selectedGroup: t('contacts', 'All contacts') },
			})
		}
	},

	methods: {
		/**
		 * Process input type file change
		 *
		 * @param {Event} event the input change event
		 */
		processFile(event) {
			this.loading = true
			this.$store.dispatch('changeStage', 'parsing')

			const file = event.target.files[0]
			const reader = new FileReader()

			const addressbook = this.selectedAddressbook
			this.$store.dispatch('setAddressbook', addressbook.displayName)

			const self = this
			reader.onload = function(e) {
				self.isOpened = false
				self.$store.dispatch('importContactsIntoAddressbook', { vcf: reader.result, addressbook })

				// reset input
				event.target.value = ''
				self.resetState()
			}
			reader.readAsText(file)
		},

		async processLocalFile(path) {
			console.debug('Importing', path)
			try {
				this.cancelRequest()

				// prepare cancel token for axios request
				const source = CancelToken.source()
				this.cancelRequest = source.cancel

				const file = await axios.get(generateRemoteUrl(`dav/files/${getCurrentUser().uid}`) + encodePath(path), {
					cancelToken: source.token,
				})

				const addressbook = this.selectedAddressbook
				this.$store.dispatch('changeStage', 'parsing')
				this.$store.dispatch('setAddressbook', addressbook.displayName)

				if (file.data) {
					await this.$store.dispatch('importContactsIntoAddressbook', { vcf: file.data, addressbook })
				}
			} catch (error) {
				console.error('Something wrong happened while processing local file', error)
			}
		},

		toggleModal() {
			this.isOpened = !this.isOpened
			// cancel any ongoing request if closed
			if (!this.isOpened) {
				this.cancelRequest()
			}
		},

		clickImportInput() {
			this.$refs['contact-import-input'].click()
		},

		/**
		 * Open nextcloud file picker
		 */
		async openPicker() {
			try {
				this.loading = true
				// unlikely, but let's cancel any previous request
				this.cancelRequest()

				// pick, retrieve & process file
				const path = await picker.pick()
				await this.processLocalFile(path)
			} catch (error) {
				console.error('Something wrong happened while picking a file', error)
			} finally {
				this.resetState()
			}
		},

		/**
		 * Reset default component state
		 */
		resetState() {
			this.cancelRequest = () => {}
			this.importDestination = false
			this.isOpened = false
			this.loading = false
		},
	},
}
</script>

<style lang="scss" scoped>
.import-contact {
	&__modal {
		section {
			padding: 22px;
			// only one padding bewteen sections
			&:not(:last-child) {
				padding-bottom: 0;
			}
		}
		&-pick {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			justify-content: space-evenly;
		}
	}
	&__button {
		display: flex;
		align-items: center;
		flex: 0 1 150px;
		width: 150px;
		// spread evenly
		margin: 10px;
		padding: 10px;
		&-icon {
			width: 32px;
			height: 32px;
			margin-right: 5px;
		}
		&-main {
			width: 100% !important;
			margin-left: 0 !important;
		}
		&-disabled {
			// Wrap warning about disabled button instead of ellipsing it
			::v-deep .button-vue__text {
				white-space: pre-wrap;
			}
		}
		&--cancel:not(:focus):not(:hover) {
			border-color: transparent;
			background-color: transparent;
		}
	}
}

</style>
