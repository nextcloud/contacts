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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<!-- same uid can coexists between different addressbooks
		so we need to use the addressbook id as key as well -->
	<recycle-scroller
		id="contacts-list" :class="{'icon-loading': loading, showdetails: selectedContact}" class="app-content-list"
		:items="list"
		:item-size="68"
		key-field="key">
		<template v-slot="{ item, index }">
			<contacts-list-item :contact="contacts[item.key]"
				:search-query="searchQuery" :index="index" :key="item.key"
				@deleted="selectContact" />
		</template>
	</recycle-scroller>
</template>

<script>
import ContactsListItem from './ContactsList/ContactsListItem'
import { RecycleScroller } from 'vue-virtual-scroller/dist/vue-virtual-scroller.umd.js'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

export default {
	name: 'ContactsList',

	components: {
		ContactsListItem,
		RecycleScroller
	},

	props: {
		list: {
			type: Array,
			required: true
		},
		contacts: {
			type: Object,
			required: true
		},
		loading: {
			type: Boolean,
			default: true
		},
		searchQuery: {
			type: String,
			default: ''
		}
	},

	computed: {
		selectedContact() {
			return this.$route.params.selectedContact
		},
		selectedGroup() {
			return this.$route.params.selectedGroup
		}
	},

	methods: {
		// Select closest contact on deletion
		selectContact(oldIndex) {
			if (this.list.length > 0 && oldIndex < this.list.length) {
				// priority to the one above then the one after
				const newContact = oldIndex === 0 ? this.list[oldIndex + 1] : this.list[oldIndex - 1]
				if (newContact) {
					this.$router.push({ name: 'contact', params: { selectedGroup: this.selectedGroup, selectedContact: newContact.key } })
				}
			}
		}
	}
}
</script>
