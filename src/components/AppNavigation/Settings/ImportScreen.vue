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
					{{ n('contacts', 'Import contacts', 'Import contacts', entries.length) }}
				</NcButton>
			</div>
		</template>

		<template v-else>
			<h4 class="import-modal__title">
				{{ activeFileLabel }}
			</h4>

			<NcProgressBar class="import-modal__progress-bar" :value="progressValue" size="medium" />

			<div class="import-modal__counters">
				<NcNoteCard type="info">
					<strong>{{ totals.discovered }}</strong> {{ t('contacts', 'Discovered') }}
				</NcNoteCard>
				<NcNoteCard type="info">
					<strong>{{ totals.processed }}</strong> {{ t('contacts', 'Processed') }}
				</NcNoteCard>
				<NcNoteCard type="success">
					<strong>{{ totals.created }}</strong> {{ t('contacts', 'Created') }}
				</NcNoteCard>
				<NcNoteCard type="info">
					<strong>{{ totals.updated }}</strong> {{ t('contacts', 'Updated') }}
				</NcNoteCard>
				<NcNoteCard type="warning">
					<strong>{{ totals.exists }}</strong> {{ t('contacts', 'Skipped') }}
				</NcNoteCard>
				<NcNoteCard type="error">
					<strong>{{ totals.error }}</strong> {{ t('contacts', 'Errors') }}
				</NcNoteCard>
			</div>
		</template>
	</Modal>
</template>

<script>
import { NcModal as Modal, NcButton, NcNoteCard, NcProgressBar } from '@nextcloud/vue'
import Upload from 'vue-material-design-icons/TrayArrowUp.vue'
import ImportScreenRow from './ImportScreenRow.vue'

export default {
	name: 'ImportScreen',
	components: {
		NcButton,
		NcNoteCard,
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
		gap: 12px;
		padding: 12px;
		margin: 0;
	}

	&__actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 12px;
	}

	&__title {
		padding: 12px 12px 0;
		text-align: center;
	}

	&__progress-bar {
		margin: 12px;
		width: calc(100% - 24px);
	}

	&__counters {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
		padding: 12px;
	}
}
</style>
