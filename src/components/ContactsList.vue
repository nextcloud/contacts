<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppContentList class="content-list">
		<NcDialog :open="showDeleteConfirmationDialog"
			:name="n(
				'contacts',
				'Delete {number} contact',
				'Delete {number} contacts',
				multiSelectedContacts.size,
				{ number: multiSelectedContacts.size }
			)"
			:buttons="buttons"
			no-close>
			{{ t('contacts', 'Are you sure you want to proceed?') }}
			<NcNoteCard v-if="readOnlyMultiSelectedCount"
				type="info"
				:text="n('contacts',
					'Please note that {number} contact is read only and won\'t be deleted',
					'Please note that {number} contacts are read only and won\'t be deleted',
					readOnlyMultiSelectedCount,
					{ number: readOnlyMultiSelectedCount })" />
		</NcDialog>

		<div class="contacts-list__header">
			<div class="search-contacts-field">
				<input v-model="query" type="text" :placeholder="t('contacts', 'Search contacts …')">
			</div>
		</div>
		<transition name="contacts-list__multiselect-header">
			<div v-if="isMultiSelecting" class="contacts-list__multiselect-header">
				<NcButton type="tertiary"
					:title="t('contacts', 'Unselect {number}', { number: multiSelectedContacts.size })"
					:close-after-click="true"
					@click.prevent="unselectAllMultiSelected">
					<IconSelect :size="16" />
				</NcButton>
				<NcButton type="tertiary"
					:disabled="!isAtLeastOneEditable"
					:title="deleteActionTitle"
					:close-after-click="true"
					@click.prevent="attemptDeleteAllMultiSelected">
					<IconDelete :size="16" />
				</NcButton>
			</div>
		</transition>

		<VirtualList ref="scroller"
			class="contacts-list"
			data-key="key"
			:data-sources="filteredList"
			:data-component="ContactsListItem"
			:estimate-size="68"
			:extra-props="{reloadBus, onSelectMultipleFromParent: onSelectMultiple, onSelectRangeFromParent: onSelectRange }" />
	</AppContentList>
</template>

<script>
import { NcAppContentList as AppContentList, NcButton, NcDialog, NcNoteCard } from '@nextcloud/vue'
import ContactsListItem from './ContactsList/ContactsListItem.vue'
import VirtualList from 'vue-virtual-scroll-list'
import IconSelect from 'vue-material-design-icons/CloseThick.vue'
import IconDelete from 'vue-material-design-icons/DeleteOutline.vue'
// eslint-disable-next-line import/no-unresolved
import IconCancelRaw from '@mdi/svg/svg/cancel.svg?raw'
// eslint-disable-next-line import/no-unresolved
import IconDeleteRaw from '@mdi/svg/svg/delete-outline.svg'

export default {
	name: 'ContactsList',

	components: {
		AppContentList,
		NcNoteCard,
		VirtualList,
		NcButton,
		IconSelect,
		IconDelete,
		NcDialog,
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
			multiSelectedContacts: new Map(),
			refreshKey: 0, // used to force re-render of the list when search query changes, can be removed in vue3
			showDeleteConfirmationDialog: false,
			buttons: [
				{
					label: t('contacts', 'Cancel'),
					icon: IconCancelRaw,
					callback: () => { this.showDeleteConfirmationDialog = false },
				},
				{
					label: t('contacts', 'Delete'),
					type: 'primary',
					icon: IconDeleteRaw,
					callback: () => { this.deleteAllMultiSelected() },
				},
			],
			lastToggledIndex: undefined,
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
			const contactsList = this.list
				.filter(item => this.matchSearch(this.contacts[item.key]))
				.map(item => this.contacts[item.key])

			contactsList.forEach((contact, index) => {
				contact.isMultiSelected = this.multiSelectedContacts.has(index)
			})

			return contactsList
		},
		isMultiSelecting() {
			return this.multiSelectedContacts.size > 0
		},
		readOnlyMultiSelectedCount() {
			let count = 0

			this.multiSelectedContacts.forEach((contact) => {
				if (contact.addressbook.readOnly) {
					count++
				}
			})

			return count
		},
		isAtLeastOneEditable() {
			return this.readOnlyMultiSelectedCount !== this.multiSelectedContacts.size
		},
		deleteActionTitle() {
			return this.isAtLeastOneEditable
				? n('contacts', 'Delete {number} contact', 'Delete {number} contacts', this.multiSelectedContacts.size, { number: this.multiSelectedContacts.size })
				: t('contacts', 'Please select at least one editable contact to delete')
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

		onSelectMultiple(contact, index, isRange = false) {
			if (isRange && this.lastToggledIndex !== index) {
				if (this.onSelectRange(index)) {
					return
				}
			}

			if (this.multiSelectedContacts.has(index)) {
				this.multiSelectedContacts.delete(index)
			} else {
				this.multiSelectedContacts.set(index, contact)
			}
			this.lastToggledIndex = index
			this.$set(this, 'multiSelectedContacts', new Map(this.multiSelectedContacts))
		},

		onSelectRange(index) {
			const lastToggledIndex = this.lastToggledIndex ?? undefined
			if (lastToggledIndex === undefined) {
				return false
			}

			const start = Math.min(lastToggledIndex, index)
			const end = Math.max(lastToggledIndex, index)
			const selected = this.multiSelectedContacts.has(index)

			const newSelection = new Map(this.multiSelectedContacts)

			for (let i = start; i <= end; i++) {
				if (!selected) {
					newSelection.set(i, this.filteredList[i])
				} else {
					newSelection.delete(i)
				}
			}

			this.lastToggledIndex = index
			this.$set(this, 'multiSelectedContacts', newSelection)

			return true
		},

		unselectAllMultiSelected() {
			this.$set(this, 'multiSelectedContacts', new Map())
			this.lastToggledIndex = undefined
		},

		attemptDeleteAllMultiSelected() {
			this.showDeleteConfirmationDialog = true
		},

		deleteAllMultiSelected() {
			this.multiSelectedContacts.forEach(async (contact) => {
				if (contact.addressbook.readOnly) {
					// Do not try to delete read only contacts
					return
				}
				await new Promise(resolve => setTimeout(resolve, 500))
				await this.$store.dispatch('deleteContact', { contact })
			})
			this.unselectAllMultiSelected()
			this.showDeleteConfirmationDialog = false
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

.contacts-list__multiselect-header {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	background-color: var(--color-main-background-translucent);
	position: sticky;
	height: calc(var(--default-grid-baseline) * 12);
	z-index: 100;
}

.contacts-list__multiselect-header-enter-active, .contacts-list__multiselect-header-leave-active {
	transition: all calc(var(--animation-slow) / 2);
}

.contacts-list__multiselect-header-enter,
.contacts-list__multiselect-header-leave-to {
	opacity: 0;
	height: 0;
	transform: scaleY(0);
}
</style>
