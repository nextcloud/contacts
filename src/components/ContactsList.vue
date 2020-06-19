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
	<RecycleScroller
		v-if="haveContact"
		id="contacts-list"
		ref="scroller"
		:class="{'icon-loading': loading, showdetails: selectedContact}"
		class="app-content-list"
		:items="filteredList"
		:item-size="itemHeight"
		key-field="key">
		<template v-slot="{ item, index }">
			<ContactsListItem
				v-if="contacts[item.key]"
				:key="item.key"
				:contact="contacts[item.key]"
				:index="index"
				@deleted="selectContact" />
		</template>
	</RecycleScroller>

	<div v-else class="app-content-list">
		<EmptyContent>
			{{ t('contacts', 'No contacts in this group') }}
			<template #action>
				<button class="primary" @click="onAddContactsToGroup">
					{{ t('forms', 'Add some') }}
				</button>
			</template>
		</EmptyContent>
	</div>
</template>

<script>
import ContactsListItem from './ContactsList/ContactsListItem'
import EmptyContent from './EmptyContent'
import { RecycleScroller } from 'vue-virtual-scroller/dist/vue-virtual-scroller.umd.js'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

export default {
	name: 'ContactsList',

	components: {
		ContactsListItem,
		EmptyContent,
		RecycleScroller,
	},

	props: {
		list: {
			type: Array,
			required: true,
		},
		contacts: {
			type: Object,
			required: true,
		},
		loading: {
			type: Boolean,
			default: true,
		},
		searchQuery: {
			type: String,
			default: '',
		},
	},

	data() {
		return {
			itemHeight: 68,
		}
	},

	computed: {
		selectedContact() {
			return this.$route.params.selectedContact
		},
		selectedGroup() {
			return this.$route.params.selectedGroup
		},
		filteredList() {
			return this.list.filter(contact => this.matchSearch(this.contacts[contact.key]))
		},
		haveContact() {
			return this.selectedGroup && this.filteredList.length > 0
		},
	},

	watch: {
		selectedContact: function(key) {
			this.$nextTick(() => {
				this.scrollToContact(key)
			})
		},
		list: function(val, old) {
			// we just loaded the list and the url already have a selected contact
			// if not, the selectedContact watcher will take over
			// to select the first entry
			if (val.length !== 0 && old.length === 0 && this.selectedContact) {
				this.$nextTick(() => {
					this.scrollToContact(this.selectedContact)
				})
			}
		},
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
		},

		/**
		 * Scroll to the desired contact if in the list and not visible
		 *
		 * @param {String} key the contact unique key
		 */
		scrollToContact(key) {
			const item = this.$el.querySelector('#' + btoa(key).slice(0, -2))

			// if the item is not visible in the list or barely visible
			if (!(item && item.getBoundingClientRect().y > 50)) { // header height
				const index = this.list.findIndex(contact => contact.key === key)
				if (index > -1) {
					this.$refs.scroller.scrollToItem(index)
				}
			}

			// if item is a bit out (bottom) of the list, let's just scroll a bit to the top
			if (item) {
				const pos = item.getBoundingClientRect().y + this.itemHeight - (this.$el.offsetHeight + 50)
				if (pos > 0) {
					const scroller = this.$refs.scroller.$el
					scroller.scrollTop = scroller.scrollTop + pos
				}
			}
		},

		/**
		 * Is this matching the current search ?
		 *
		 * @param {Contact} contact the contact to search
		 * @returns {boolean}
		 */
		matchSearch(contact) {
			if (this.searchQuery.trim() !== '') {
				return contact.searchData.toString().toLowerCase().search(this.searchQuery.trim().toLowerCase()) !== -1
			}
			return true
		},

		onAddContactsToGroup() {
			// TODO: add popup
		},
	},
}
</script>

<style lang="scss" scoped>
// Virtual scroller overrides
.vue-recycle-scroller {
	position: sticky !important;
}

.vue-recycle-scroller__item-view {
	// TODO: find better solution?
	// https://github.com/Akryum/vue-virtual-scroller/issues/70
	// hack to not show the transition
	overflow: hidden;
	// same as app-content-list-item
	height: 68px;
}
</style>
