<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="batch">
		<div class="batch__title">
			<h3 v-if="mode === 'group'">
				{{ t('contacts', 'Add contacts to groups') }}
			</h3>
			<h3 v-if="mode === 'move'">
				{{ t('contacts', 'Move contacts to addressbook') }}
			</h3>
		</div>

		<!-- Group selector for group mode -->
		<NcSelect
			v-if="mode === 'group'"
			v-model="selectedGroups"
			:input-label="t('contacts', 'Select groups')"
			:multiple="true"
			:options="groupOptions" />

		<!-- Addressbook selector for move mode -->
		<NcSelect
			v-if="mode === 'move'"
			v-model="selectedAddressesBook"
			:input-label="t('contacts', 'Select addressbook')"
			:options="moveTargetOptions" />

		<h6>{{ t('contacts', 'Selected contacts') }}</h6>
		<NcNoteCard v-if="mode === 'group' && canModifyCount !== contacts.length" type="info">
			{{ t('contacts', 'Please note that only {count} of the {total} contacts can be added to a group', { count: canModifyCount, total: contacts.length }) }}
		</NcNoteCard>
		<NcNoteCard v-if="mode === 'move' && canDeleteCount !== contacts.length" type="info">
			{{ t('contacts', 'Please note that only {count} of the {total} contacts can be moved', { count: canDeleteCount, total: contacts.length }) }}
		</NcNoteCard>

		<div class="contacts-list">
			<div v-for="(contact, index) in contactsLimited" :key="contact.key" class="contact-item">
				<ContactsListItem
					v-if="mode === 'group'"
					:key="contact.key"
					:class="{ disabled: !contact.addressbook.canModifyCard }"
					:index="index"
					:source="contact"
					:reload-bus="reloadBus"
					:title="contact.addressbook.canModifyCard ? '' : t('contacts', 'This contact cannot be grouped')"
					:is-static="true"
					:show-addressbook="true" />

				<ContactsListItem
					v-if="mode === 'move'"
					:key="contact.key"
					:class="{ disabled: !contact.addressbook.canDeleteCard }"
					:index="index"
					:source="contact"
					:reload-bus="reloadBus"
					:title="contact.addressbook.canDeleteCard ? '' : t('contacts', 'This contact cannot be moved')"
					:is-static="true"
					:show-addressbook="true" />
			</div>
		</div>

		<NcButton
			v-if="contacts.length > 9"
			variant="secondary"
			@click="showAllContacts = !showAllContacts">
			<template #icon>
				<IconPlus :size="20" />
			</template>
			{{ t('contacts', showAllContacts ? 'Show less' : 'Show all') }}
		</NcButton>

		<div class="batch__footer">
			<NcButton
				v-if="mode === 'group'"
				variant="primary"
				:disabled="selectedGroups.length === 0"
				@click="submit">
				<template #icon>
					<IconAccountPlus :size="20" />
				</template>
				{{ t('contacts', 'Add') }}
			</NcButton>
			<NcButton
				v-if="mode === 'move'"
				variant="primary"
				:disabled="!selectedAddressesBook"
				@click="submit">
				<template #icon>
					<IconBookArrow :size="20" />
				</template>
				{{ t('contacts', 'Move') }}
			</NcButton>
		</div>
	</div>
</template>

<script>
import { NcButton, NcNoteCard, NcSelect } from '@nextcloud/vue'
import IconAccountPlus from 'vue-material-design-icons/AccountMultiplePlusOutline.vue'
import IconBookArrow from 'vue-material-design-icons/BookArrowRightOutline.vue'
import IconPlus from 'vue-material-design-icons/Plus.vue'
import ContactsListItem from './ContactsListItem.vue'
import appendContactToGroup from '../../services/appendContactToGroup.js'
import contacts from '../../store/contacts.js'

export default {
	name: 'Batch',

	components: {
		ContactsListItem,
		NcButton,
		NcSelect,
		IconPlus,
		IconAccountPlus,
		IconBookArrow,
		NcNoteCard,
	},

	props: {
		contacts: {
			type: Array,
			required: true,
		},

		mode: {
			type: String,
			required: false,
			default: 'group',
		},
	},

	emits: ['submit'],

	data() {
		return {
			reloadBus: null,
			showAllContacts: false,
			selectedGroups: [],
			selectedAddressesBook: null,
		}
	},

	computed: {
		contactsLimited() {
			if (this.showAllContacts) {
				return this.contacts
			}
			return this.contacts.slice(0, 9)
		},

		groupOptions() {
			return this.$store.getters.getGroups.map((group) => ({
				label: group.name,
				value: group.name,
			}))
		},

		canModifyCount() {
			return this.contacts.filter((contact) => contact.addressbook.canModifyCard).length
		},

		canDeleteCount() {
			return this.contacts.filter((contact) => contact.addressbook.canDeleteCard).length
		},

		moveTargetOptions() {
			// Provide only enabled, writable addressbooks to move to
			return this.$store.getters.getAddressbooks
				.filter((ab) => ab.canCreateCard && ab.enabled)
				.map((ab) => ({ label: ab.displayName || ab.label || ab.addressbook, value: ab.id || ab.addressbook }))
		},
	},

	methods: {
		submit() {
			if (this.mode === 'group') {
				this.group()
			}

			if (this.mode === 'move') {
				this.moveToAddressbook()
			}
		},

		async group() {
			const allGroups = this.$store.getters.getGroups

			// Add to groups
			this.selectedGroups.forEach((selectedGroup) => {
				const group = allGroups.find((g) => g.name === selectedGroup.value)
				if (!group) {
					console.error('Cannot add contact to an undefined group', selectedGroup)
					return
				}
				this.contacts.forEach((contact) => {
					if (!contact.addressbook.canModifyCard) {
						return
					} // skip read-only for groups
					if (contact.groups && contact.groups.includes(group.name)) {
						return
					}
					appendContactToGroup(contact, group.name)
						.then(() => {
							this.$store.dispatch('addContactToGroup', { contact, groupName: group.name })
						})
						.catch((error) => {
							console.error(error)
						})
				})
			})

			this.$emit('submit')
		},

		async moveToAddressbook() {
			if (!this.selectedAddressesBook) {
				return
			}
			const addressbook = this.$store.getters.getAddressbooks.find((ab) => ab.id === this.selectedAddressesBook.value)
			if (!addressbook) {
				console.error('Selected addressbook not found', this.selectedAddressesBook)
				return
			}

			const movePromises = this.contacts.map(async (contact) => {
				if (!contact.addressbook.canDeleteCard || contact.addressbook.id === addressbook.id) {
					return null
				}
				try {
					await this.$store.dispatch('moveContactToAddressbook', { contact, addressbook })
					return contact
				} catch (error) {
					console.error('Failed to move contact', contact, error)
					return null
				}
			})

			await Promise.all(movePromises)

			this.$emit('submit')
		},
	},
}
</script>

<style lang="scss" scoped>

.batch {
	margin: calc(var(--default-grid-baseline) * 8);

	&__title {
		margin-bottom: var(--default-grid-baseline);
	}

	&__footer {
		width: 100%;
		display: flex;
		justify-content: flex-end;
	}

	.contacts-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--default-grid-baseline);
		margin: calc(var(--default-grid-baseline) * 2) 0;

		.disabled {
			opacity: 0.5;
		}
	}
}
</style>
