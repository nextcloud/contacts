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
	<AppContent>
		<div v-if="loading">
			<EmptyContent icon="icon-loading">
				{{ t('contacts', 'Loading contacts …') }}
			</EmptyContent>
		</div>

		<div v-else-if="isEmptyGroup && !isRealGroup">
			<EmptyContent icon="icon-contacts-dark">
				{{ t('contacts', 'There are no contacts yet') }}
				<template #desc>
					<button class="primary" @click="newContact">
						{{ t('contacts', 'Create contact') }}
					</button>
				</template>
			</EmptyContent>
		</div>

		<div v-else-if="isEmptyGroup && isRealGroup">
			<EmptyContent icon="icon-contacts-dark">
				{{ t('contacts', 'There are no contacts in this group') }}
				<template #desc>
					<button v-if="contacts.length === 0" class="primary" @click="addContactsToGroup(selectedGroup)">
						{{ t('contacts', 'Create contacts') }}
					</button>
					<button v-else class="primary" @click="addContactsToGroup(selectedGroup)">
						{{ t('contacts', 'Add contacts') }}
					</button>
				</template>
			</EmptyContent>
		</div>

		<div v-else id="app-content-wrapper">
			<!-- contacts list -->
			<ContactsList
				:list="contactsList"
				:contacts="contacts"
				:search-query="searchQuery" />

			<!-- main contacts details -->
			<ContactDetails :contact-key="selectedContact" />
		</div>
	</AppContent>
</template>
<script>
import { emit } from '@nextcloud/event-bus'
import AppContent from '@nextcloud/vue/dist/Components/AppContent'
import EmptyContent from '@nextcloud/vue/dist/Components/EmptyContent'

import ContactDetails from '../ContactDetails'
import ContactsList from '../ContactsList'
import RouterMixin from '../../mixins/RouterMixin'

export default {
	name: 'ContactsContent',

	components: {
		AppContent,
		ContactDetails,
		ContactsList,
		EmptyContent,
	},

	mixins: [RouterMixin],

	props: {
		loading: {
			type: Boolean,
			default: true,
		},

		contactsList: {
			type: Array,
			required: true,
		},
	},

	data() {
		return {
			searchQuery: '',
		}
	},

	computed: {
		// store variables
		contacts() {
			return this.$store.getters.getContacts
		},
		groups() {
			return this.$store.getters.getGroups
		},
		sortedContacts() {
			return this.$store.getters.getSortedContacts
		},

		/**
		 * Is this a real group ?
		 * Aka not a dynamically generated one like `All contacts`
		 * @returns {boolean}
		 */
		isRealGroup() {
			return this.groups.findIndex(group => group.name === this.selectedGroup) > -1
		},
		/**
		 * Is the current group empty
		 * @returns {boolean}
		 */
		isEmptyGroup() {
			return this.contactsList.length === 0
		},
	},

	methods: {
		/**
		 * Forward the addContactsToGroup event to the parent
		 * @param {string} groupName the group name
		 */
		addContactsToGroup(groupName) {
			emit('contacts:group:append', groupName)
		},

		/**
		 * Forward the newContact event to the parent
		 */
		newContact() {
			this.$emit('newContact')
		},
	},
}
</script>
