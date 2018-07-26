<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Team Popcorn <teampopcornberlin.gmail.com>
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
	<div>
		<label for="contact-import">Sort by:</label>
		<multiselect :value="options[0]" :options="options"
			class="multiselect-vue"
			@input="sortContacts()"/>
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
		return {
			options: ['First-name', 'Lastname', 'Display name'],
			value: 'First-name'
		}
	},
	computed: {

	},
	methods: {
		sortContacts() {
			alert('sorting contacts')
		}
	}
}
</script>
