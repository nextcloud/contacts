<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppContentList class="content-list">
		<div class="contacts-list__header">
			<div class="search-contacts-field">
				<input v-model="query" type="text" :placeholder="t('contacts', 'Search contacts …')">
			</div>
		</div>
		<VirtualList ref="scroller"
			class="contacts-list"
			data-key="key"
			:data-sources="filteredList"
			:data-component="ContactsListItem"
			:estimate-size="68"
			:extra-props="{reloadBus}" />
	</AppContentList>
</template>

<script>
import { NcAppContentList as AppContentList } from '@nextcloud/vue'
import ContactsListItem from './ContactsList/ContactsListItem.vue'
import VirtualList from 'vue-virtual-scroll-list'

export default {
	name: 'ContactsList',

	components: {
		AppContentList,
		VirtualList,
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
		reloadBus: {
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			ContactsListItem,
			query: '',
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
	min-height: calc(var(--default-grid-baseline) * 12)
}

// Search field
.search-contacts-field {
	padding: var(--default-grid-baseline) calc(var(--default-grid-baseline) * 2) var(--default-grid-baseline) calc(var(--default-grid-baseline) * 12);

	> input {
		width: 100%;
	}
}

.content-list {
	overflow-y: auto;
	padding: 0 var(--default-grid-baseline);
}

</style>
