<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="sort-contacts">
		<IconList class="settings-line__icon" />
		<NcSelect id="sort-by"
			:value="orderKeyOption"
			:searchable="false"
			:allow-empty="false"
			:options="options"
			:input-label="t('contacts', 'Sort by')"
			label="label"
			@update:model-value="sortContacts" />
	</div>
</template>

<script>
import { NcSelect } from '@nextcloud/vue'
import IconList from 'vue-material-design-icons/FormatListBulletedSquare.vue'

export default {
	name: 'SettingsSortContacts',

	components: {
		NcSelect,
		IconList,
	},

	data() {
		return {
			selected: null,
		}
	},

	computed: {
		/* Order Keys */
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
		/* Current order Key */
		orderKey() {
			return this.$store.getters.getOrderKey
		},
		orderKeyOption() {
			return this.options.filter(option => option.key === this.orderKey)[0]
		},
	},
	methods: {
		sortContacts(selected) {
			const value = selected && selected.value ? selected.value : 'displayName'
			this.$store.commit('setOrder', value)
			this.$store.commit('sortContacts')
			localStorage.setItem('orderKey', key)
		},
		formatSortByLabel(option) {
			return t('contacts', 'Sort by {sorting}', { sorting: option.label })
		},
	},
}
</script>
<style lang="scss" scoped>
.sort-contacts {
	display: flex;
}
</style>
