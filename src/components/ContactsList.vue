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
				variant="info"
				:text="n('contacts',
					'Please note that {number} contact is read only and will not be deleted',
					'Please note that {number} contacts are read only and will not be deleted',
					readOnlyMultiSelectedCount,
					{ number: readOnlyMultiSelectedCount })" />
		</NcDialog>

		<NcModal v-if="isMerging"
			:name="t('contacts', 'Merge contacts')"
			size="large"
			@close="isMerging = false">
			<Merging :contacts="multiSelectedContacts" @finished="finishContactMerging" />
		</NcModal>

		<div class="contacts-list__header">
			<div class="search-contacts-field">
				<input v-model="query" type="text" :placeholder="t('contacts', 'Search contacts …')">
			</div>
		</div>
		<transition name="contacts-list__multiselect-header">
			<div v-if="isMultiSelecting" class="contacts-list__multiselect-header">
				<NcButton variant="tertiary"
					:title="t('contacts', 'Unselect {number}', { number: multiSelectedContacts.size })"
					:close-after-click="true"
					@click.prevent="unselectAllMultiSelected">
					<IconSelect :size="16" />
				</NcButton>
				<NcButton variant="tertiary"
					:disabled="!isAtLeastOneEditable"
					:title="deleteActionTitle"
					:close-after-click="true"
					@click.prevent="attemptDeleteAllMultiSelected">
					<IconDelete :size="16" />
				</NcButton>
				<NcButton v-if="!isMergingLoading"
					type="tertiary"
					:disabled="!areTwoEditable"
					:title="mergeActionTitle"
					:close-after-click="true"
					@click.prevent="initiateContactMerging">
					<IconSetMerge :size="20" />
				</NcButton>
				<NcLoadingIcon v-else :size="20" />
			</div>
		</transition>

		<VList v-slot="{ item, index }"
			ref="scroller"
			class="contacts-list"
			:data="filteredList">
			<ContactsListItem :key="item.key"
				:index="index"
				:source="item"
				:reload-bus="reloadBus"
				:on-select-multiple-from-parent="onSelectMultiple" />
		</VList>
	</AppContentList>
</template>

<script>
import { NcAppContentList as AppContentList, NcButton, NcDialog, NcNoteCard, NcModal, NcLoadingIcon } from '@nextcloud/vue'
import ContactsListItem from './ContactsList/ContactsListItem.vue'
import { VList } from 'virtua/vue'
import IconSelect from 'vue-material-design-icons/CloseThick.vue'
import IconDelete from 'vue-material-design-icons/TrashCanOutline.vue'
import IconSetMerge from 'vue-material-design-icons/SetMerge.vue'
import Merging from './ContactsList/Merging.vue'

// eslint-disable-next-line import/no-unresolved
import IconCancelRaw from '@mdi/svg/svg/cancel.svg?raw'
// eslint-disable-next-line import/no-unresolved
import IconDeleteRaw from '@mdi/svg/svg/delete-outline.svg'
import RouterMixin from '../mixins/RouterMixin.js'

export default {
	name: 'ContactsList',

	components: {
		AppContentList,
		NcNoteCard,
		VList,
		NcButton,
		IconSelect,
		IconDelete,
		IconSetMerge,
		NcDialog,
		NcModal,
		Merging,
		NcLoadingIcon,
		ContactsListItem,
	},

	mixins: [
		RouterMixin,
	],

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
			isMerging: false,
			isMergingLoading: false,
		}
	},

	computed: {
		filteredList() {
			let contactsList = this.list
				.filter(item => this.matchSearch(this.contacts[item.key]))
				.map(item => this.contacts[item.key])

			contactsList = contactsList.filter(item => item !== undefined)

			contactsList.forEach((contact, index) => {
				if (contact !== undefined) {
					contact.isMultiSelected = this.multiSelectedContacts.has(index)
				}
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
		areTwoEditable() {
			return this.multiSelectedContacts.size - this.readOnlyMultiSelectedCount === 2
		},
		deleteActionTitle() {
			return this.isAtLeastOneEditable
				? n('contacts', 'Delete {number} contact', 'Delete {number} contacts', this.multiSelectedContacts.size, { number: this.multiSelectedContacts.size })
				: t('contacts', 'Please select at least one editable contact to delete')
		},
		mergeActionTitle() {
			return this.areTwoEditable
				? t('contacts', 'Merge contacts')
				: t('contacts', 'Please select two editable contacts to merge')
		},
	},

	watch: {
		async selectedContact(key) {
			if (!key) {
				return
			}

			await this.$nextTick()
			this.scrollToContact(key)
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
			const index = this.list.findIndex(contact => contact.key === key)
			if (index === -1) {
				return
			}

			const scroller = this.$refs.scroller
			const scrollerBoundingRect = scroller.$el.getBoundingClientRect()
			const item = this.$el.querySelector('#' + key.slice(0, -2))
			const itemBoundingRect = item?.getBoundingClientRect()

			// Try to scroll the item fully into view
			if (!item || itemBoundingRect.y < scrollerBoundingRect.y) {
				// Item is above the current scroll window (or partly overlapping)
				scroller.scrollToIndex(index)
			} else if (item) {
				const itemHeight = scroller.getItemSize(index)
				const pos = itemBoundingRect.y + itemHeight - (this.$el.offsetHeight + 50)
				if (pos > 0) {
					// Item is below the current scroll window (or partly overlapping)
					scroller.scrollTo(scroller.scrollOffset + pos)
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
			this.multiSelectedContacts = new Map(this.multiSelectedContacts)
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
			this.multiSelectedContacts = newSelection

			return true
		},

		unselectAllMultiSelected() {
			this.multiSelectedContacts = new Map()
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

		async initiateContactMerging() {
			// For every contact in the multiSelectedContacts, we need to dispatch the load contact action
			this.isMergingLoading = true
			const contacts = Array.from(this.multiSelectedContacts.values())
			for (const contact of contacts) {
				await this.$store.dispatch('fetchFullContact', { contact })
			}

			this.isMergingLoading = false
			this.isMerging = true
		},

		async finishContactMerging(mergedContact) {
			// After merging, we need to update the contact in the store
			await this.$store.dispatch('fetchFullContact', { contact: mergedContact, forceReFetch: true })

			this.unselectAllMultiSelected()
			this.isMerging = false

			await this.$router.push({
				name: 'root',
			})
		},
	},
}
</script>

<style lang="scss" scoped>
// Make virtual scroller scrollable
.contacts-list {
	flex: 1 auto;
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
