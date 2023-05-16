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
	<div class="sort-contacts">
		<IconList class="settings-line__icon" />
		<NcSelect id="sort-by"
			:value="orderKeyOption"
			:searchable="false"
			:allow-empty="false"
			:options="options"
			:custom-label="formatSortByLabel"
			track-by="key"
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
