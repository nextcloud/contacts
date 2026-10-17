<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<li class="import-modal-file-item">
		<NcFormGroup :label="t('contacts', 'Importing file')">
			<NcFormBox v-slot="{ itemClass }">
				<NcFormBoxCopyButton :class="itemClass" :label="t('contacts', 'File')" :value="file.name" />
			</NcFormBox>
			<NcFormBox v-slot="{ itemClass }">
				<NcSelect
					v-model="selectedAddressbook"
					:class="itemClass"
					:input-id="addressbookInputId"
					:input-label="t('contacts', 'Address book')"
					:options="addressbookOptions"
					:allow-empty="false"
					:clearable="false"
					label="displayName" />
			</NcFormBox>
			<NcFormBox v-if="isStreamImportSupported" v-slot="{ itemClass }">
				<NcSelect
					v-model="selectedFormat"
					:class="itemClass"
					:input-id="formatInputId"
					:input-label="t('contacts', 'File format')"
					:options="formatOptions"
					:allow-empty="false"
					:clearable="false"
					label="label" />
			</NcFormBox>
			<NcFormBox v-if="isStreamImportSupported" v-slot="{ itemClass }">
				<NcFormBoxSwitch
					:class="itemClass"
					:model-value="supersede"
					:label="t('contacts', 'Overwrite existing contacts')"
					:description="t('contacts', 'Replace contacts in the address book that match the imported ones instead of skipping them.')"
					@update:model-value="setSupersede" />
			</NcFormBox>
		</NcFormGroup>
	</li>
</template>

<script>
import { NcFormBox, NcFormBoxCopyButton, NcFormBoxSwitch, NcFormGroup, NcSelect } from '@nextcloud/vue'
import { mapStores } from 'pinia'
import { IMPORT_NEW_ADDRESSBOOK_ID } from '../../../models/constants.ts'
import { isStreamImportSupported } from '../../../services/importService.ts'
import useImportStore from '../../../store/import.ts'

export default {
	name: 'ImportScreenRow',
	components: {
		NcFormBox,
		NcFormBoxCopyButton,
		NcFormBoxSwitch,
		NcFormGroup,
		NcSelect,
	},

	props: {
		entry: {
			type: Object,
			required: true,
		},
	},

	computed: {
		...mapStores(useImportStore),

		file() {
			return this.entry.file
		},

		isStreamImportSupported() {
			return isStreamImportSupported()
		},

		addressbookInputId() {
			return `import-addressbook-${this.file.id}`
		},

		formatInputId() {
			return `import-format-${this.file.id}`
		},

		formatOptions() {
			return [{
				id: 'vcf',
				label: t('contacts', 'vCard (.vcf)'),
			}, {
				id: 'jcf',
				label: t('contacts', 'jCard (.json)'),
			}, {
				id: 'xcf',
				label: t('contacts', 'xCard (.xml)'),
			}]
		},

		selectedFormat: {
			get() {
				const format = this.entry.options.format
				return this.formatOptions.find((option) => option.id === format) ?? this.formatOptions[0]
			},

			set(option) {
				if (!option) {
					return
				}
				this.importStore.setOptionsForFile({
					fileId: this.file.id,
					options: { format: option.id },
				})
			},
		},

		supersede() {
			return this.entry.options.supersede
		},

		newAddressbook() {
			return {
				id: IMPORT_NEW_ADDRESSBOOK_ID,
				displayName: t('contacts', 'New address book'),
			}
		},

		writableAddressbooks() {
			return this.$store.getters.getAddressbooks
				.filter((addressbook) => !addressbook.readOnly && addressbook.enabled && addressbook.canCreateCard)
				.map((addressbook) => ({ id: addressbook.id, displayName: addressbook.displayName }))
		},

		addressbookOptions() {
			return [...this.writableAddressbooks, this.newAddressbook]
		},

		selectedAddressbook: {
			get() {
				const addressbookId = this.entry.addressbookId
				return this.addressbookOptions.find((option) => option.id === addressbookId) ?? this.addressbookOptions[0]
			},

			set(option) {
				if (!option) {
					return
				}
				this.importStore.setAddressbookForFile({
					fileId: this.file.id,
					addressbookId: option.id,
				})
			},
		},
	},

	created() {
		const preselected = this.addressbookOptions[0]
		this.importStore.setAddressbookForFile({
			fileId: this.file.id,
			addressbookId: preselected.id,
		})
	},

	methods: {
		setSupersede(supersede) {
			this.importStore.setOptionsForFile({
				fileId: this.file.id,
				options: { supersede },
			})
		},
	},
}
</script>

<style lang="scss" scoped>
.import-modal-file-item {
	&:not(:last-child) {
		border-bottom: var(--border-width-input) solid var(--color-border);
		padding-bottom: calc(var(--default-grid-baseline) * 4);
		margin-bottom: calc(var(--default-grid-baseline) * 4);
	}

	:deep(.nc-select) {
		width: 100%;
		min-width: 0;
	}
}
</style>
