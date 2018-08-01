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
			v-model="value"
			:searchable="false"
			:allow-empty="false"
			:placeholder="placeholder"
			:options="options"
			track-by="key"
			label="label"
			input="key"
			class="multiselect-vue"
			@input="sortContacts" />
	</div>
</template>

<script>
import clickOutside from 'vue-click-outside'
import Multiselect from 'vue-multiselect'

export default {
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
	data() {
		return {}
	},
	computed: {

		/* Order Keys */
		options() {
			return Array(
				{
					label: t('settings', 'First name'),
					key: 'firstName'
				},
				{
					label: t('settings', 'Lastname'),
					key: 'lastName'
				},
				{
					label: t('settings', 'Display-name'),
					key: 'displayName'
				}
			);
		},

		/* Current order Key */
		orderKey() {
			return this.$store.getters.getOrderKey;
		},

		placeholder() {
			return t('settings', this.orderKey)
		}

	},
	methods: {
		sortContacts(orderKey = 'displayName') {
			this.$store.commit('setOrder', orderKey)
			this.$store.commit('sortContacts')
		}
	}
}
</script>
