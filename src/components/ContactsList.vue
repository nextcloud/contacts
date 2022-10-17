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
	<AppContentList class="content-list">
		<div class="contacts-list__header">
			<div class="search-contacts-field">
				<input v-model="query" type="text" :placeholder="t('contacts', 'Search contacts …')">
			</div>
			<Actions
				class="merge-button"
				menu-align="right">
				<template v-if="selected.length >= 1">
					<ActionButton v-if="showAddToGroup"
						icon="icon-clone"
						@click="OpenMultiselect">
						{{ t('contacts', 'Add to group') }}
					</ActionButton>
					<Multiselect v-if="showSelectGroup"
						:options="groups"
						:taggable="true"
						@input="addSelectedContactsToGroup"
						@tag="addSelectedContactsToGroup"
						@close="closeMultiselect" />
				</template>
				<ActionButton v-if="selected.length >= 2"
					:close-after-click="true"
					icon="icon-clone"
					@click="mergeContact">
					{{ t('contacts', 'Merge') }}
				</ActionButton>
				<ActionButton v-if="selected.length >= 1"
					:close-after-click="true"
					icon="icon-delete"
					@click="deleteMultipleContact">
					{{ t('contacts', 'Delete') }}
				</ActionButton>
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
import AppContentList from '@nextcloud/vue/dist/Components/NcAppContentList'
import ContactsListItem from './ContactsList/ContactsListItem'
import VirtualList from 'vue-virtual-scroll-list'
import Actions from '@nextcloud/vue/dist/Components/NcActions'
import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton'
import naturalCompare from 'string-natural-compare'
import Multiselect from '@nextcloud/vue/dist/Components/NcMultiselect'

export default {
	name: 'ContactsList',

	components: {
		AppContentList,
		VirtualList,
		Actions,
		ActionButton,
		Multiselect
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
			query: '',
			selected: [],
			showGroups: false,
			showAddToGroup: true,
			showSelectGroup: false,
		}
	},

	computed: {
		groups() {
			return this.$store.getters.getGroups.slice(0).map(group => group.name)
				.sort((a, b) => naturalCompare(a, b, { caseInsensitive: true }))
		},
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

	mounted() {
		this.query = this.searchQuery
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
			if (this.query.trim() !== '') {
				return contact.searchData.toString().toLowerCase().search(this.query.trim().toLowerCase()) !== -1
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
		cleanContactValue(contact, value) {
			contact.jCal[1].forEach(element => {
				if (element[0] === value[0] && element[3] === '' && !Array.isArray(element[3])) {
					contact.jCal[1].splice(contact.jCal[1].indexOf(element), 1)
				} else if (element[0] === value[0] && Array.isArray(element[3])) {
					let isempty = true
					value[3].forEach(arr => {
						if (arr !== '') {
							isempty = false
						}
					})
					if (isempty === false) {
						contact.jCal[1].splice(contact.jCal[1].indexOf(element), 1)
					}
				}
			})
		},
		addValue(contact, jcalvalue) {
			jcalvalue.filter(element => {
				// exclude the unique field we don't want to add
				return !['uid', 'version', 'fn', 'prodid', 'gender', 'rev'].includes(element[0])
			}).forEach(value => {
				if (Array.isArray(value[3])) {
					let isempty = true
					value[3].forEach(arr => {
						if (arr !== '') {
							isempty = false
						}
					})
					if (isempty === false) {
						// delete blank field of the same type and push the new field
						this.cleanContactValue(contact, value)
						contact.jCal[1].push(value)
					}
				} else if (value[3] !== '') {
					let include = false
					contact.jCal[1].forEach(element => {
						if (element[0] === value[0] && element[3] === value[3]) {
							include = true
						}
					})
					if (!include) {
						// delete blank field of the same type and push the new field
						this.cleanContactValue(contact, value)
						contact.jCal[1].push(value)
					}
				}
			})
			return contact
		},
		mergeContact() {
			const firstContact = this.contacts[this.selected[0]]
			this.selected.slice(1).forEach((element) => {
				if (this.contacts[element]) {
					const contactjcal = this.contacts[element].jCal[1]
					this.addValue(firstContact, contactjcal)
					// delete the contact merged and the uid in the selected
					this.$store.dispatch('deleteContact', { contact: this.contacts[element] }) && this.selected.splice(this.selected.indexOf(element), 1)
				}
			})
			this.$store.dispatch('updateContact', firstContact)
		},
		OpenMultiselect() {
			this.showAddToGroup = false
			this.showSelectGroup = true
		},
		closeMultiselect() {
			this.showAddToGroup = true
			this.showSelectGroup = false
		},
		addSelectedContactsToGroup(value) {
			this.selected.forEach(element => {
				const selectedContact = this.contacts[element]
				const data = selectedContact.groups
				if (!data.includes(value)) {
					this.$store.dispatch('addContactToGroup', {
						contact: selectedContact,
						groupName: value,
					})
					data.push(value)
					selectedContact.groups = data
					this.$store.dispatch('updateContact', selectedContact)
				}
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

// Search field
.search-contacts-field {
	padding: 5px 10px 5px 40px;

	> input {
		width: 100%;
	}
}

.content-list {
	overflow-y: auto;
	padding: 0 4px;
}

.merge-button {
	float: right;
}
</style>
