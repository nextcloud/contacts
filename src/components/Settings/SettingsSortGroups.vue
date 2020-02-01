<!--
  - @copyright Copyright (c) 2020 Uriel Fontan <urielfontan2002@gmail.com>
  -
  - @author Uriel Fontan <urielfontan2002@gmail.com>
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
	<div class="sort-groups">
		<multiselect
			id="sort-by"
			:value="orderGroupsOption"
			:searchable="false"
			:allow-empty="false"
			:options="options"
			:custom-label="formatSortByLabel"
			track-by="key"
			label="label"
			@input="sortGroups" />
	</div>
</template>

<script>

export default {
	name: 'SettingsSortGroups',

	computed: {
		/* Order Keys */
		options() {
			return [
				{
					label: t('contacts', 'Amount'),
					key: 'amount',
				},
				{
					label: t('contacts', 'Alphabetical Order'),
					key: 'alphabetically',
				},
			]
		},
		/* Current order Key */
		orderGroups() {
			return this.$store.getters.getOrderGroups
		},
		orderGroupsOption() {
			return this.options.filter(option => option.key === this.orderGroups)[0]
		},
	},
	methods: {
		sortGroups(orderGroups) {
			const key = orderGroups && orderGroups.key ? orderGroups.key : 'amount'
			this.$store.commit('setOrderGroups', key)
			this.$store.commit('sortGroups')
			localStorage.setItem('orderGroups', key)
		},
		formatSortByLabel(option) {
			return t('contacts', 'Sort by {sorting}', { sorting: option.label })
		},
	},
}
</script>
