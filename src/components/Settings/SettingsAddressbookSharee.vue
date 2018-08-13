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
	<li class="addressbook__sharee">
		<span v-if="sharee.group" class="icon icon-group" />
		<span v-else class="icon icon-user" />
		<span class="addressbook__sharee__identifier">{{ sharee.displayname }}</span>
		<span class="addressbook__sharee__utils">
			<input
				:id="sharee.displayname"
				v-model="writeable"
				class="checkbox"
				name="editable"
				type="checkbox">
			<label :for="sharee.displayName" @click="editSharee"> can edit</label>
			<span href="#" title="Delete"
				class="icon-delete"
				@click="deleteSharee" />
		</span>
	</li>
</template>

<script>
import clickOutside from 'vue-click-outside'

export default {
	name: 'SettingsShareSharee',
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
	computed: {
		writeable() {
			return this.sharee.writeable
		}
	},
	methods: {
		deleteSharee() {
			setTimeout(() => { this.$store.dispatch('removeSharee', this.sharee) }, 500)
		},
		editSharee() {
			this.$store.dispatch('toggleShareeWritable', this.sharee)
		}
	}
}
</script>
