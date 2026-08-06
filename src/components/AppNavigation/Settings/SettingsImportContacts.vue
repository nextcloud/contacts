<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="import-contact">
		<NcButton
			v-if="hasWritableAddressbooks"
			class="import-contact__button"
			:wide="true"
			:disabled="disableImport"
			@click="$refs.importInput.click()">
			<template #icon>
				<IconUpload :size="20" />
			</template>
			{{ t('contacts', 'Import contacts') }}
		</NcButton>
		<NcButton
			v-else
			class="import-contact__button import-contact__button--disabled"
			:wide="true"
			disabled>
			<template #icon>
				<IconError :size="20" />
			</template>
			{{ t('contacts', 'Importing is disabled because there are no address books available') }}
		</NcButton>

		<input
			ref="importInput"
			class="hidden"
			type="file"
			:accept="supportedFileTypes"
			:disabled="disableImport"
			multiple
			@change="processFiles">

		<ImportScreen
			v-if="showImportModal"
			:entries="entries"
			:stage="stage"
			:totals="totals"
			:active-session="activeSession"
			@cancel-import="cancelImport"
			@import-contacts="importContacts" />
	</div>
</template>

<script>
import { getCurrentUser } from '@nextcloud/auth'
import axios from '@nextcloud/axios'
import { showError, showSuccess, showWarning } from '@nextcloud/dialogs'
import { encodePath } from '@nextcloud/paths'
import { generateRemoteUrl } from '@nextcloud/router'
import { NcButton } from '@nextcloud/vue'
import { mapState, mapStores } from 'pinia'
import IconError from 'vue-material-design-icons/AlertCircleOutline.vue'
import IconUpload from 'vue-material-design-icons/UploadOutline.vue'
import ImportScreen from './ImportScreen.vue'
import useImportStore from '../../../store/import.ts'

const SUPPORTED_FILE_TYPES = 'text/vcard,.vcf,application/json,.json,application/xml,text/xml,.xml'

/**
 * Read a File object as a UTF-8 string.
 *
 * @param {File} file the file to read
 * @return {Promise<string>}
 */
function readFileAsText(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result)
		reader.onerror = () => reject(reader.error)
		reader.readAsText(file)
	})
}

export default {
	name: 'SettingsImportContacts',

	components: {
		ImportScreen,
		NcButton,
		IconError,
		IconUpload,
	},

	computed: {
		...mapStores(useImportStore),
		...mapState(useImportStore, {
			entries: 'files',
			stage: 'stage',
			totals: 'totals',
			activeSession: 'activeSession',
		}),

		supportedFileTypes() {
			return SUPPORTED_FILE_TYPES
		},

		// writable address books available as import destinations
		writableAddressbooks() {
			return this.$store.getters.getAddressbooks
				.filter((addressbook) => !addressbook.readOnly && addressbook.enabled && addressbook.canCreateCard)
		},

		hasWritableAddressbooks() {
			return this.writableAddressbooks.length > 0
		},

		// only allow uploading new files while idle
		allowUploadOfFiles() {
			return this.stage === 'idle'
		},

		showImportModal() {
			return this.stage === 'selecting' || this.stage === 'importing'
		},

		disableImport() {
			return !this.hasWritableAddressbooks || !this.allowUploadOfFiles
		},
	},

	async mounted() {
		// Direct import deep link from the Files app
		if (this.$route.name === 'import') {
			const path = this.$route.query.file
			if (path) {
				await this.processLocalFile(path)
			}

			this.$router.push({
				name: 'group',
				params: { selectedGroup: t('contacts', 'All contacts') },
			})
		}
	},

	methods: {
		/**
		 * Validate that a file looks like importable contact data.
		 *
		 * @param {string} name the file name
		 * @param {string} contents the file contents
		 * @return {boolean}
		 */
		validateFile(name, contents) {
			if (!contents.trim()) {
				return false
			}
			// For plain vCard files we can cheaply confirm at least one card is present.
			if (!name.endsWith('.json') && !name.endsWith('.xml')) {
				return /BEGIN:VCARD/i.test(contents)
			}
			return true
		},

		/**
		 * Queue an already loaded file for import.
		 *
		 * @param {string} name the file name
		 * @param {string} contents the file contents
		 * @param {object} [meta] optional file metadata
		 * @param {number} [meta.lastModified] last modified timestamp
		 * @param {number} [meta.size] file size in bytes
		 * @param {string} [meta.type] MIME type
		 * @return {boolean} whether the file was queued
		 */
		queueFile(name, contents, { lastModified = Date.now(), size = contents.length, type = 'text/vcard' } = {}) {
			if (!this.validateFile(name, contents)) {
				showError(t('contacts', '{filename} could not be parsed', { filename: name }))
				return false
			}

			this.importStore.addFile({
				contents,
				lastModified,
				name,
				size,
				type,
				parser: {
					getName: () => null,
				},
			})
			return true
		},

		/**
		 * Process all files submitted from the file input.
		 *
		 * @param {Event} event the change event of the input field
		 */
		async processFiles(event) {
			this.importStore.stage = 'preparing'
			let addedFiles = false

			for (const file of event.target.files) {
				const contents = await readFileAsText(file)
				if (this.queueFile(file.name, contents, {
					lastModified: file.lastModified,
					size: file.size,
					type: file.type || 'text/vcard',
				})) {
					addedFiles = true
				}
			}

			this.resetInput()

			if (!addedFiles) {
				showError(t('contacts', 'No valid files found, aborting import'))
				this.importStore.removeAllFiles()
				this.importStore.reset()
				return
			}

			this.importStore.stage = 'selecting'
		},

		/**
		 * Fetch a file from the user's Files storage and queue it for import.
		 *
		 * @param {string} path the path of the file in the user's storage
		 */
		async processLocalFile(path) {
			this.importStore.stage = 'preparing'
			try {
				const file = await axios.get(generateRemoteUrl(`dav/files/${getCurrentUser().uid}`) + encodePath(path))
				const name = path.split('/').pop()
				if (file.data && this.queueFile(name, file.data)) {
					this.importStore.stage = 'selecting'
					return
				}
				this.importStore.reset()
			} catch (error) {
				console.error('Something went wrong while processing the local file', error)
				this.importStore.reset()
			}
		},

		/**
		 * Resolve (or create) the destination address book for a queued entry.
		 *
		 * Lives here rather than in the import store so the store stays decoupled
		 * from the Vuex address book store.
		 *
		 * @param {object} entry the queued import entry
		 * @return {Promise<{id: string, displayName: string}>}
		 */
		async resolveTarget(entry) {
			const { file, addressbookId } = entry

			if (addressbookId !== 'new') {
				const addressbook = this.$store.getters.getAddressbooks.find((book) => book.id === addressbookId)
				if (!addressbook) {
					throw new Error(t('contacts', 'Selected address book not found'))
				}
				return { id: addressbook.id, displayName: addressbook.displayName }
			}

			const displayName = file.parser.getName?.() || t('contacts', 'Imported {filename}', { filename: file.name })
			const existingIds = new Set(this.$store.getters.getAddressbooks.map((book) => book.id))
			await this.$store.dispatch('appendAddressbook', { displayName })
			const addressbook = this.$store.getters.getAddressbooks.find((book) => !existingIds.has(book.id))
			if (!addressbook) {
				throw new Error(t('contacts', 'Could not create address book'))
			}

			this.importStore.setAddressbookForFile({ fileId: file.id, addressbookId: addressbook.id })
			return { id: addressbook.id, displayName: addressbook.displayName }
		},

		/**
		 * Import all queued files into the selected address books.
		 */
		async importContacts() {
			const totals = await this.importStore.startImport((entry) => this.resolveTarget(entry))

			// collect the address books that received contacts before resetting state
			const targetIds = [...new Set(Object.values(this.importStore.sessions)
				.map((session) => session.targetId)
				.filter((id) => id !== null))]

			if (totals.discovered === totals.created + totals.updated + totals.exists && totals.error === 0) {
				showSuccess(n('contacts', 'Successfully imported %n contact', 'Successfully imported %n contacts', totals.discovered))
			} else {
				showWarning(t('contacts', 'Import partially failed. Imported {accepted} out of {total}.', {
					accepted: totals.processed - totals.error,
					total: totals.discovered,
				}))
			}

			// reload the affected address books so imported contacts appear
			for (const id of targetIds) {
				const addressbook = this.$store.getters.getAddressbooks.find((book) => book.id === id)
				if (addressbook) {
					await this.$store.dispatch('getContactsFromAddressBook', { addressbook })
				}
			}

			this.importStore.removeAllFiles()
			this.importStore.reset()
		},

		/**
		 * Reset the import state without importing.
		 */
		cancelImport() {
			this.importStore.removeAllFiles()
			this.importStore.reset()
			this.resetInput()
		},

		/**
		 * Manually reset the file input so re-selecting the same files triggers change.
		 */
		resetInput() {
			if (this.$refs.importInput) {
				this.$refs.importInput.value = ''
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.import-contact {
	&__button--disabled {
		// Wrap warning about disabled button instead of ellipsing it
		:deep(.button-vue__text) {
			white-space: pre-wrap;
		}
	}
}
</style>
