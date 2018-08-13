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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
-->

<template>
	<div class="sort-contacts">
		<label for="sort-by">{{ t('contacts', 'Sort by:') }}</label>
		<multiselect
			id="sort-by"
			:placeholder="orderKey"
			:searchable="false"
			:allow-empty="false"
			:options="options"
			track-by="key"
			label="label"
			class="multiselect-vue"
			@input="sortContacts" />
	</div>
</template>

<script>
import clickOutside from 'vue-click-outside'
import Multiselect from 'vue-multiselect'

export default {
	name: 'SettingsSortContacts',
	components: {
		clickOutside,
		Multiselect
	},
	directives: {
		clickOutside
	},
	props: {
		addressbook: {
			type: Object,
			default() {
				return {}
			}
		}
	},
	computed: {
		/* Order Keys */
		options() {
			return [
				{
					label: t('contacts', 'First name'),
					key: 'firstName'
				},
				{
					label: t('contacts', 'Last name'),
					key: 'lastName'
				},
				{
					label: t('contacts', 'Display name'),
					key: 'displayName'
				}
			]
		},
		/* Current order Key */
		orderKey() {
			return t('contacts', this.options.filter(f => f.key === this.$store.getters.getOrderKey)[0].label)
		}
	},
	methods: {
		sortContacts(orderKey) {
			const key = orderKey && orderKey.key ? orderKey.key : 'displayName'
			this.$store.commit('setOrder', key)
			this.$store.commit('sortContacts')
			localStorage.setItem('orderKey', key)
		}
	}
}
</script>
