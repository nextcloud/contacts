<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="batch">
		<div class="batch__title">
			<h3>{{ t('contacts', 'Add contacts to groups') }}</h3>
		</div>

		<NcSelect v-model="selectedGroups"
			:input-label="t('contacts', 'Select groups')"
			:multiple="true"
			:options="groupOptions" />

		<h6>{{ t('contacts', 'Selected contacts') }}</h6>
		<NcNoteCard v-if="amountOfReadOnlyContacts > 0" type="info">
			{{ t('contacts', 'Please note that {count} contact{p} readonly and will not be added to groups. If you want to include them all you can create a Team instead.', { count: amountOfReadOnlyContacts, p: amountOfReadOnlyContacts === 1 ? ' is' : 's are' }) }}
		</NcNoteCard>

		<div class="contacts-list">
			<div v-for="(contact, index) in contactsLimited" :key="contact.key" class="contact-item">
				<ContactsListItem :key="contact.key"
					:class="{ disabled: !contact.addressbook.canModifyCard }"
					:index="index"
					:source="contact"
					:reload-bus="reloadBus"
					:title="contact.addressbook.canModifyCard ? '' : t('contacts', 'This contact is read-only and cannot be added to groups. Try creating a Team instead.')"
					:is-static="true" />
			</div>
		</div>

		<NcButton v-if="contacts.length > 9" variant="secondary" @click="showAllContacts = !showAllContacts">
			<template #icon>
				<IconPlus :size="20" />
			</template>
			{{ t('contacts', showAllContacts ? 'Show less' : 'Show all') }}
		</NcButton>

		<div class="batch__footer">
			<NcButton variant="primary" :disabled="selectedGroups.length === 0" @click="submit">
				<template #icon>
					<IconAccountPlus :size="20" />
				</template>
				{{ t('contacts', 'Add') }}
			</NcButton>
		</div>
	</div>
</template>

<script>
import ContactsListItem from './ContactsListItem.vue'
import { NcButton, NcSelect, NcNoteCard } from '@nextcloud/vue'
import IconPlus from 'vue-material-design-icons/Plus.vue'
import IconAccountPlus from 'vue-material-design-icons/AccountMultiplePlusOutline.vue'
import appendContactToGroup from '../../services/appendContactToGroup.js'

export default {
	name: 'Batch',

	components: {
		ContactsListItem,
		NcButton,
		NcSelect,
		IconPlus,
		IconAccountPlus,
		NcNoteCard,
	},

	props: {
		contacts: {
			type: Array,
			required: true,
		},
	},

	data() {
		return {
			reloadBus: null,
			showAllContacts: false,
			selectedGroups: [],
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
			return this.$store.getters.getGroups.map(group => ({
				label: group.name,
				value: group.name,
			}))
		},
		amountOfReadOnlyContacts() {
			return this.contacts.filter(contact => !contact.addressbook.canModifyCard).length
		},
	},

	methods: {
		async submit() {
			const allGroups = this.$store.getters.getGroups

			// Add to groups
			this.selectedGroups.forEach(groupName => {
				const group = allGroups.find(g => g.name === groupName)
				if (!group) {
					console.error('Cannot add contact to an undefined group', groupName)
					return
				}
				this.contacts.forEach(contact => {
					if (!contact.addressbook.canModifyCard) return // skip read-only for groups
					if (contact.groups && contact.groups.includes(group.name)) return
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
