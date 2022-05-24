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
	<AppContentList>
		<div class="contacts-list__header">
			<Actions
				class="merge-button"
				menu-align="right">
				<slot v-if="selected.length >= 1">
					<ActionButton icon="icon-delete" @click="deleteMultipleContact">
						{{ t('contacts', 'Delete') }}
					</ActionButton>
				</slot>
			</Actions>
		</div>
		<VirtualList ref="scroller"
			class="contacts-list"
			data-key="key"
			:data-sources="filteredList"
			:data-component="ContactsListItem"
			:estimate-size="68"
			:extra-props={selected}
			@update-check-selected="selectionChanged" />
	</AppContentList>
</template>

<script>
import AppContentList from '@nextcloud/vue/dist/Components/AppContentList'
import ContactsListItem from './ContactsList/ContactsListItem'
import VirtualList from 'vue-virtual-scroll-list'
import Actions from '@nextcloud/vue/dist/Components/Actions'
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'

export default {
	name: 'ContactsList',

	components: {
		AppContentList,
		VirtualList,
		Actions,
		ActionButton,
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
		searchQuery: {
			type: String,
			default: '',
		},
	},

	data() {
		return {
			ContactsListItem,
			selected: [],
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
			return this.list
				.filter(item => this.matchSearch(this.contacts[item.key]))
				.map(item => this.contacts[item.key])
		},
	},

	watch: {
		selectedContact(key) {
			this.$nextTick(() => {
				this.scrollToContact(key)
			})
		},
		list(val, old) {
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
		 * @param {string} key the contact unique key
		 */
		scrollToContact(key) {
			const item = this.$el.querySelector('#' + btoa(key).slice(0, -2))

			// if the item is not visible in the list or barely visible
			if (!(item && item.getBoundingClientRect().y > 50)) { // header height
				const index = this.list.findIndex(contact => contact.key === key)
				if (index > -1) {
					this.$refs.scroller.scrollToIndex(index)
				}
			}

			// if item is a bit out (bottom) of the list, let's just scroll a bit to the top
			if (item) {
				const pos = item.getBoundingClientRect().y + this.itemHeight - (this.$el.offsetHeight + 50)
				if (pos > 0) {
					const scroller = this.$refs.scroller.$el
					scroller.scrollToOffset(scroller.scrollTop + pos)
				}
			}
		},

		/**
		 * Is this matching the current search ?
		 *
		 * @param {Contact} contact the contact to search
		 * @return {boolean}
		 */
		matchSearch(contact) {
			if (this.searchQuery.trim() !== '') {
				return contact.searchData.toString().toLowerCase().search(this.searchQuery.trim().toLowerCase()) !== -1
			}
			return true
		},
		selectionChanged(newValue) {
			if (this.selected.includes(newValue)) {
				this.selected.splice(this.selected.indexOf(newValue), 1)
			} else {
				this.selected.push(newValue)
			}
		},
		deleteMultipleContact() {
			const temp = []
			this.selected.forEach(element => {
				if (this.contacts[element]) {
					// delete contact
					this.$store.dispatch('deleteContact', { contact: this.contacts[element] })
					temp.push(this.selected.indexOf(element), 1)
				}
			})
			// delete the uid in selected of the contact deleted
			temp.forEach(el => {
				this.selected.splice(temp, 1)
			})
		},
	},
}
</script>

<style lang="scss" scoped>
// Make virtual scroller scrollable
.contacts-list {
	max-height: calc(100vh - var(--header-height) - 48px);
	overflow: auto;
}

// Add empty header to contacts-list that solves overlapping of contacts with app-navigation-toogle
.contacts-list__header {
	min-height: 48px;
}

.merge-button {
	float: right;
}
</style>
