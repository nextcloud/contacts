<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<Modal
		class="import-modal"
		size="normal"
		:name="t('contacts', 'Import destination selection')"
		@close="cancelImport">
		<template v-if="isSelecting">
			<transition-group class="import-modal__file-list" tag="ul">
				<ImportScreenRow v-for="entry in entries" :key="`import-file-${entry.file.id}`" :entry="entry" />
			</transition-group>

			<div class="import-modal__actions">
				<NcButton @click="cancelImport">
					{{ t('contacts', 'Cancel') }}
				</NcButton>
				<NcButton variant="primary" @click="importContacts">
					<template #icon>
						<Upload :size="20" />
					</template>
					{{ t('contacts', 'Import contacts') }}
				</NcButton>
			</div>
		</template>

		<template v-else>
			<h4 class="import-modal__title">
				{{ activeFileLabel }}
			</h4>

			<NcProgressBar class="import-modal__progress-bar" :value="progressValue" size="medium" />

			<p v-if="statusLine" class="import-modal__status">
				{{ statusLine }}
			</p>
		</template>
	</Modal>
</template>

<script>
import { getLanguage } from '@nextcloud/l10n'
import { NcModal as Modal, NcButton, NcProgressBar } from '@nextcloud/vue'
import Upload from 'vue-material-design-icons/TrayArrowUp.vue'
import ImportScreenRow from './ImportScreenRow.vue'

export default {
	name: 'ImportScreen',
	components: {
		NcButton,
		NcProgressBar,
		ImportScreenRow,
		Modal,
		Upload,
	},

	props: {
		entries: {
			type: Array,
			required: true,
		},

		stage: {
			type: String,
			required: true,
		},

		totals: {
			type: Object,
			required: true,
		},

		activeSession: {
			type: Object,
			default: null,
		},
	},

	emits: ['cancelImport', 'importContacts'],

	computed: {
		isSelecting() {
			return this.stage === 'selecting'
		},

		progressValue() {
			return Math.round(this.totals.processed / Math.max(this.totals.discovered, 1) * 100)
		},

		/**
		 * Progress summary listing only the counters that are not zero.
		 *
		 * @return {string}
		 */
		statusLine() {
			const { discovered, processed, created, updated, exists, error } = this.totals
			const parts = []
			if (discovered > 0) {
				parts.push(n('contacts', 'Processing {processed} of %n', 'Processing {processed} of %n', discovered, { processed }))
			}
			if (created > 0) {
				parts.push(n('contacts', 'Created %n', 'Created %n', created))
			}
			if (updated > 0) {
				parts.push(n('contacts', 'Updated %n', 'Updated %n', updated))
			}
			if (exists > 0) {
				parts.push(n('contacts', 'Skipped %n', 'Skipped %n', exists))
			}
			if (error > 0) {
				parts.push(n('contacts', 'Failed %n', 'Failed %n', error))
			}

			return new Intl.ListFormat(getLanguage(), { type: 'unit' }).format(parts)
		},

		activeFileLabel() {
			if (!this.activeSession) {
				return t('contacts', 'Preparing import…')
			}

			return t('contacts', 'Importing {fileName} into {addressbook}', {
				fileName: this.activeSession.fileName,
				addressbook: this.activeSession.targetDisplayName || t('contacts', 'selected address book'),
			})
		},
	},

	methods: {
		importContacts() {
			this.$emit('importContacts')
		},

		cancelImport() {
			this.$emit('cancelImport')
		},
	},
}
</script>

<style lang="scss" scoped>
.import-modal {
	&__file-list {
		display: flex;
		flex-direction: column;
		gap: calc(var(--default-grid-baseline) * 3);
		padding: calc(var(--default-grid-baseline) * 3);
		margin: 0;
	}

	&__actions {
		display: flex;
		justify-content: flex-end;
		gap: calc(var(--default-grid-baseline) * 2);
		padding: calc(var(--default-grid-baseline) * 3);
	}

	&__title {
		padding: calc(var(--default-grid-baseline) * 3) calc(var(--default-grid-baseline) * 3) 0;
		text-align: center;
	}

	&__progress-bar {
		margin: calc(var(--default-grid-baseline) * 3);
		width: calc(100% - var(--default-grid-baseline) * 6);
	}

	&__status {
		padding: 0 calc(var(--default-grid-baseline) * 3) calc(var(--default-grid-baseline) * 3);
		color: var(--color-text-maxcontrast);
		text-align: center;
	}
}
</style>
