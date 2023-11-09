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
	<AppContent v-if="loading">
		<EmptyContent class="empty-content" :name="t('contacts', 'Loading contacts …')">
			<template #icon>
				<IconLoading :size="20" />
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else-if="isEmptyGroup && !isRealGroup">
		<EmptyContent class="empty-content" :name="t('contacts', 'There are no contacts yet')">
			<template #icon>
				<IconContact :size="20" />
			</template>
			<template #desc>
				<Button type="primary" @click="newContact">
					{{ t('contacts', 'Create contact') }}
				</Button>
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else-if="isEmptyGroup && isRealGroup">
		<EmptyContent class="empty-content" :name=" t('contacts', 'There are no contacts in this group')">
			<template #icon>
				<IconContact :size="20" />
			</template>
			<template #desc>
				<Button v-if="contacts.length === 0" type="primary" @click="addContactsToGroup(selectedGroup)">
					{{ t('contacts', 'Create contacts') }}
				</Button>
				<Button v-else type="primary" @click="addContactsToGroup(selectedGroup)">
					{{ t('contacts', 'Add contacts') }}
				</Button>
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else :show-details="showDetails" @update:showDetails="hideDetails">
		<!-- contacts list -->
		<template #list>
			<ContactsList :list="contactsList"
				:contacts="contacts"
				:search-query="searchQuery"
				:reload-bus="reloadBus" />
		</template>

		<!-- main contacts details -->
		<ContactDetails :contact-key="selectedContact" :contacts="sortedContacts" :reload-bus="reloadBus" />
	</AppContent>
</template>
<script>
import { emit } from '@nextcloud/event-bus'
import {
	NcAppContent as AppContent,
	NcButton as Button,
	NcEmptyContent as EmptyContent,
	NcLoadingIcon as IconLoading,
} from '@nextcloud/vue'

import ContactDetails from '../ContactDetails.vue'
import ContactsList from '../ContactsList.vue'
import IconContact from 'vue-material-design-icons/AccountMultiple.vue'
import RouterMixin from '../../mixins/RouterMixin.js'
import Vue from 'vue'

export default {
	name: 'ContactsContent',

	components: {
		AppContent,
		Button,
		ContactDetails,
		ContactsList,
		EmptyContent,
		IconContact,
		IconLoading,
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
			// communication for ContactListItem and ContactDetails (reload avatar)
			reloadBus: new Vue(),
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

		selectedContact() {
			return this.$route.params.selectedContact
		},

		/**
		 * Is this a real group ?
		 * Aka not a dynamically generated one like `All contacts`
		 *
		 * @return {boolean}
		 */
		isRealGroup() {
			return this.groups.findIndex(group => group.name === this.selectedGroup) > -1
		},
		/**
		 * Is the current group empty
		 *
		 * @return {boolean}
		 */
		isEmptyGroup() {
			return this.contactsList.length === 0
		},

		showDetails() {
			return !!this.selectedContact
		},
	},

	methods: {
		/**
		 * Forward the addContactsToGroup event to the parent
		 *
		 * @param {string} groupName the group name
		 */
		addContactsToGroup(groupName) {
			emit('contacts:group:append', groupName)
		},

		/**
		 * Forward the newContact event to the parent
		 */
		newContact() {
			this.$emit('new-contact')
		},

		/**
		 * Show the list and deselect contact
		 */
		hideDetails() {
			// Reset the selected contact
			this.$router.push({
				name: 'group',
				params: {
					selectedGroup: this.selectedGroup,
				},
			})
		},
	},
}
</script>
<style lang="scss" scoped>
.empty-content {
  height: 100%;
}
</style>
