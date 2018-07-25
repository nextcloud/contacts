<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
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
	<div class="app-content-list">
		<a v-for="contact in list" :key="contact.uid" href="#"
			class="app-content-list-item">
			<input :id="contact.uid" type="checkbox" class="app-content-list-item-checkbox checkbox"
				@change="toggleSelect">
			<label :for="contact.uid" />
			<div class="app-content-list-item-icon">{{ contact.displayName | firstLetter }}</div>
			<div class="app-content-list-item-line-one">{{ contact.displayName }}</div>
			<div class="icon-delete" @click="deleteItem" />
		</a>
	</div>
</template>

<script>
export default {
	name: 'ContentList',
	filters: {
		firstLetter(value) {
			return value.charAt(0)
		}
	},
	props: {
		list: {
			type: Array,
			required: true
		}
	},
	methods: {
		toggleSelect() {
		},
		deleteItem() {
		}
	}
}
</script>
