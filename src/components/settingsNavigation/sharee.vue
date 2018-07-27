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
	<li class="calendar-share-item">
		<span class="icon icon-group" />
		<span class="shareeIdentifier">{{ sharee.name }}</span>
		<span class="utils">
			<input
				:id="sharee.name"
				v-model="editSharee"
				class="checkbox"
				name="editable"
				type="checkbox">
			<label :for="sharee.name"> can edit</label>
			<span href="#" title="Delete"
				class="icon-delete"
				@click="deleteSharee()" />
		</span>
	</li>
</template>

<script>
import clickOutside from 'vue-click-outside'

export default {
	components: {
		clickOutside
	},
	directives: {
		clickOutside
	},
	props: {
		sharee: {
			type: Object,
			required: true
		}
	},
	methods: {
		deleteSharee() {
			alert('Delete')
		},
		editSharee() {
			alert('sharee can edit')
		}
	}
}
</script>
