<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<li class="import-modal-file-item">
		<NcFormGroup :label="t('contacts', 'Address book to import into')">
			<NcFormBox v-slot="{ itemClass }">
				<NcFormBoxCopyButton :class="itemClass" :label="t('contacts', 'File')" :value="file.name" />
			</NcFormBox>
			<NcFormBox v-slot="{ itemClass }">
				<div class="import-modal-file-item__field" :class="itemClass">
					<label :for="addressbookInputId" class="import-modal-file-item__field-label">
						{{ t('contacts', 'Address book') }}
					</label>
					<NcSelect
						v-model="selectedAddressbook"
						:input-id="addressbookInputId"
						:options="addressbookOptions"
						:allow-empty="false"
						:clearable="false"
						label="displayName" />
				</div>
			</NcFormBox>
		</NcFormGroup>
		<NcFormGroup :label="t('contacts', 'Import options')">
			<NcFormBox v-slot="{ itemClass }">
				<div class="import-modal-file-item__field" :class="itemClass">
					<label :for="formatInputId" class="import-modal-file-item__field-label">
						{{ t('contacts', 'File format') }}
					</label>
					<NcSelect
						v-model="selectedFormat"
						:input-id="formatInputId"
						:options="formatOptions"
						:allow-empty="false"
						:clearable="false"
						label="label" />
				</div>
			</NcFormBox>
			<NcFormBox v-slot="{ itemClass }">
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
import useImportStore from '../../../store/import.ts'

const NEW_ADDRESSBOOK_ID = 'new'

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

		addressbookInputId() {
			return `import-addressbook-${this.file.id}`
		},

		formatInputId() {
			return `import-format-${this.file.id}`
		},

		formatOptions() {
			return [{
				id: 'ical',
				label: t('contacts', 'vCard (.vcf)'),
			}, {
				id: 'jcal',
				label: t('contacts', 'jCard (.json)'),
			}, {
				id: 'xcal',
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
				id: NEW_ADDRESSBOOK_ID,
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
.import-modal-file-item__field {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 8px 12px;

	&-label {
		font-weight: bold;
	}
}
</style>
