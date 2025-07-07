<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<!-- Bulk contacts edit modal -->
	<Modal v-if="isProcessing || isProcessDone"
		:clear-view-delay="-1"
		:can-close="isProcessDone"
		@close="closeProcess">
		<AddToGroupView v-bind="processStatus" @close="closeProcess" />
	</Modal>

	<!-- contacts picker -->
	<EntityPicker v-else-if="showPicker"
		:confirm-label="t('contacts', 'Add to {group}', { group: pickerforGroup.name })"
		:data-types="pickerTypes"
		:data-set="pickerData"
		:empty-data-set-description="t('contacts', 'Please note that you can only add contacts from writable address books to contact groups. Contacts from read-only address books, such as the system address book, cannot be added.')"
		@close="onContactPickerClose"
		@submit="onContactPickerPick" />
</template>

<script>
import { subscribe } from '@nextcloud/event-bus'
import pLimit from 'p-limit'

import { NcModal as Modal } from '@nextcloud/vue'

import AddToGroupView from '../../views/Processing/AddToGroupView.vue'
import appendContactToGroup from '../../services/appendContactToGroup.js'
import EntityPicker from './EntityPicker.vue'

export default {
	name: 'ContactsPicker',

	components: {
		AddToGroupView,
		EntityPicker,
		Modal,

	},

	data() {
		return {
			// Entity picker
			showPicker: false,
			pickerforGroup: null,
			pickerData: [],
			pickerTypes: [{
				id: 'contact',
				label: t('contacts', 'Contacts'),
			}],

			// Bulk processing
			isProcessing: false,
			isProcessDone: false,
			processStatus: {
				failed: 0,
				progress: 0,
				success: 0,
				total: 0,
				name: '',
			},
			passedGroupName: '',
		}
	},
	computed: {
		contacts() {
			return this.$store.getters.getContacts
		},
		groups() {
			return this.$store.getters.getGroups
		},
		sortedContacts() {
			return this.$store.getters.getSortedContacts
		},
	},

	mounted() {
		// Watch for a add-to-group event
		subscribe('contacts:group:append', this.addContactsToGroup)
	},

	methods: {
		// Bulk contacts group management handlers
		addContactsToGroup(group) {
			console.debug('Contacts picker opened for group', group)

			this.passedGroupName = group.name ? group.name : group
			// Get the full group if we provided the group name only
			if (typeof group === 'string') {
				group = this.groups.find(a => a.name === group)
				if (!group) {
					console.error('Cannot add contact to an undefined group', group)
					return
				}
			}

			// Init data set
			this.pickerData = this.sortedContacts
				.map(({ key }) => {
					const contact = this.contacts[key]
					return {
						id: contact.key,
						label: contact.displayName,
						type: 'contact',
						readOnly: contact.addressbook.readOnly,
						groups: contact.groups,
					}
				})
				// No read only contacts
				.filter(contact => !contact.readOnly)
				// No contacts already present in group
				.filter(contact => contact.groups.indexOf(group.name) === -1)

			this.showPicker = true
			this.pickerforGroup = group
		},

		onContactPickerClose() {
			this.pickerData = []
			this.showPicker = false
		},

		onContactPickerPick(selection) {
			console.debug('Adding', selection, 'to group', this.pickerforGroup)
			const groupName = this.pickerforGroup.name

			this.isProcessing = true
			this.showPicker = false

			this.processStatus.total = selection.length
			this.processStatus.name = this.pickerforGroup.name
			this.processStatus.progress = 0
			this.processStatus.failed = 0

			// max simultaneous requests
			const limit = pLimit(3)
			const requests = []

			// create the array of requests to send
			selection.map(async entity => {
				try {
					// Get contact
					const contact = this.contacts[entity.id]

					// push contact to server and use limit
					requests.push(limit(() => appendContactToGroup(contact, groupName)
						.then(() => {
							this.$store.dispatch('addContactToGroup', { contact, groupName })
							this.processStatus.progress++
							this.processStatus.success++
						})
						.catch((error) => {
							this.processStatus.progress++
							this.processStatus.error++
							console.error(error)
						}),
					))
				} catch (e) {
					console.error(e)
				}
			})

			Promise.all(requests).then(() => {
				this.isProcessDone = true
				this.showPicker = false

				// Select group
				this.$router.push({
					name: 'group',
					params: {
						selectedGroup: typeof this.passedGroupName === 'string' ? this.passedGroupName : this.passedGroupName.name,
					},
				})

				// Auto close after 3 seconds if no errors
				if (this.processStatus.failed === 0) {
					setTimeout(this.closeProcess, 3000)
				}
			})
		},

		closeProcess() {
			this.pickerforGroup = null
			this.isProcessing = false
			this.isProcessDone = false

			// Reset
			this.processStatus.failed = 0
			this.processStatus.progress = 0
			this.processStatus.success = 0
			this.processStatus.total = 0

			if (this.passedGroupName === '' || this.passedGroupName === undefined) {
				return
			}
			// Select group
			this.$router.push({
				name: 'group',
				params: {
					selectedGroup: typeof this.passedGroupName === 'string' ? this.passedGroupName : this.passedGroupName.name,
				},
			})
		},
	},
}
</script>
