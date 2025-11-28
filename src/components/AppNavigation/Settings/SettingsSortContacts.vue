<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcFormBox>
		<div class="sort-contacts">
			<label for="sort-by" class="sort-contacts__label">
				{{ t('contacts', 'Sort contacts by') }}
			</label>
			<NcSelect
				id="sort-by"
				v-model="selected"
				:searchable="false"
				:allow-empty="false"
				:options="options"
				label="label"
				@update:model-value="sortContacts" />
		</div>
	</NcFormBox>
</template>

<script>
import { NcSelect } from '@nextcloud/vue'
import NcFormBox from '@nextcloud/vue/components/NcFormBox'

export default {
	name: 'SettingsSortContacts',

	components: {
		NcFormBox,
		NcSelect,
	},

	data() {
		return {
			selected: null,
		}
	},

	computed: {
		options() {
			return [
				{
					label: t('contacts', 'First name'),
					value: 'firstName',
				},
				{
					label: t('contacts', 'Last name'),
					value: 'lastName',
				},
				{
					label: t('contacts', 'Phonetic first name'),
					value: 'phoneticFirstName',
				},
				{
					label: t('contacts', 'Phonetic last name'),
					value: 'phoneticLastName',
				},
				{
					label: t('contacts', 'Display name'),
					value: 'displayName',
				},
				{
					label: t('contacts', 'Last modified'),
					value: 'rev',
				},
			]
		},
	},

	beforeMount() {
		this.selected = this.options.find((option) => option.value === this.$store.getters.getOrderKey) ?? null
	},

	methods: {
		sortContacts(selected) {
			const value = selected && selected.value ? selected.value : 'displayName'
			this.$store.commit('setOrder', value)
			this.$store.commit('sortContacts')
			localStorage.setItem('orderKey', value)
		},
	},
}
</script>

<style lang="scss" scoped>
.sort-contacts {
	display: flex;
	flex-direction: column;
	gap: calc(var(--default-grid-baseline) * 2);
}
</style>
