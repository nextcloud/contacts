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
			:custom-label="formatSortByLabel"
			:get-option-key="(option) => option.key"
			label="label"
			@input="sortContacts" />
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

	computed: {
		/* Order Keys */
		options() {
			return [
				{
					label: t('contacts', 'First name'),
					key: 'firstName',
				},
				{
					label: t('contacts', 'Last name'),
					key: 'lastName',
				},
				{
					label: t('contacts', 'Phonetic first name'),
					key: 'phoneticFirstName',
				},
				{
					label: t('contacts', 'Phonetic last name'),
					key: 'phoneticLastName',
				},
				{
					label: t('contacts', 'Display name'),
					key: 'displayName',
				},
				{
					label: t('contacts', 'Last modified'),
					key: 'rev',
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
		sortContacts(orderKey) {
			const key = orderKey && orderKey.key ? orderKey.key : 'displayName'
			this.$store.commit('setOrder', key)
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
