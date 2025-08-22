<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
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
				:name="t('contacts', 'Import contacts')"
				@close="toggleModal">
				<section class="import-contact__modal-addressbook">
					<h2>{{ t('contacts', 'Import contacts') }}</h2>
					<NcSelect v-if="!isSingleAddressbook"
						id="select-addressbook"
						v-model="selectedAddressbookOption"
						:allow-empty="false"
						:clearable="false"
						:options="options"
						:disabled="isSingleAddressbook || isImporting"
						:placeholder="t('contacts', 'Contacts')"
						label="displayName"
						class="import-contact__modal-addressbook__select">
						<template #selected-option="{ displayName }">
							<span>{{ t('contacts', 'Import into the {addressbookName} address book', { addressbookName: displayName }) }}</span>
						</template>
					</NcSelect>
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
					<Button variant="primary"
						:disabled="loading"
						class="import-contact__button import-contact__button--files"
						@click="openPicker">
						<template #icon>
							<IconLoading v-if="loading" :size="20" />
							<IconFolder :size="20" />
						</template>
						{{ t('contacts', 'Import from files') }}
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
import {
	NcButton as Button,
	NcModal as Modal,
	NcSelect,
	NcLoadingIcon as IconLoading,
} from '@nextcloud/vue'
import { encodePath } from '@nextcloud/paths'
import { getCurrentUser } from '@nextcloud/auth'
import { generateRemoteUrl } from '@nextcloud/router'
import { getFilePickerBuilder } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'
import IconUpload from 'vue-material-design-icons/UploadOutline.vue'
import IconError from 'vue-material-design-icons/AlertCircleOutline.vue'
import IconFolder from 'vue-material-design-icons/FolderOutline.vue'

const CancelToken = axios.CancelToken

const picker = getFilePickerBuilder(t('contacts', 'Choose a vCard file to import'))
	.setMultiSelect(false)
	.setType(1)
	.allowDirectories(false)
	.addMimeTypeFilter('text/vcard')
	.build()

export default {
	name: 'SettingsImportContacts',

	components: {
		Button,
		Modal,
		NcSelect,
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

		/**
		 * The selected address book option for the select component.
		 * We can't use the actual address book here as it can't be converted to JSON.
		 */
		selectedAddressbookOption: {
			get() {
				return this.options.find((option) => option.id === this.selectedAddressbook.id)
			},
			set(value) {
				this.selectedAddressbook = this.availableAddressbooks
					.find((addressbook) => addressbook.id === value.id)
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

			reader.onload = () => {
				this.isOpened = false
				this.$store.dispatch('importContactsIntoAddressbook', { vcf: reader.result, addressbook })

				// reset input
				event.target.value = ''
				this.resetState()
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
				// unlikely, but let's cancel any previous request
				this.cancelRequest()

				// pick, retrieve & process file
				const path = await picker.pick()
				if (path) {
					this.loading = true
					await this.processLocalFile(path)
				}
				this.resetState()

			} catch (error) {
				this.loading = false
				console.error('Something wrong happened while picking a file', error)
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
				text-align: center;
			}
		}
		&-pick {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			justify-content: space-between;
			padding-top: 0 !important;
		}
	}

	&__modal-addressbook {
		&__select {
			width: 100%;
		}
	}

	&__button {
		display: flex;
		align-items: center;
		padding: 10px;
		width: calc(50% - 20px);
		margin: 10px 0;
		&-icon {
			width: 32px;
			height: 32px;
			margin-inline-end: 5px;
		}
		&-main {
			width: 100% !important;
			margin-inline-start: 0 !important;
		}
		&-disabled {
			// Wrap warning about disabled button instead of ellipsing it
			:deep(.button-vue__text) {
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
