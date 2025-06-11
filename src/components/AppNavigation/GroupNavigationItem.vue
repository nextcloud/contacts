<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<div v-if="!isEmpty"
		class="group-drop-area"
		data-testid="group-drop-area"
		@drop="onDrop($event, group)"
		@dragenter.prevent
		@dragover="onDragOver($event)"
		@dragleave="onDragLeave($event)">
		<AppNavigationItem :key="group.key"
			:to="group.router"
			:name="group.name">
			<template #icon>
				<IconContact :size="20" />
			</template>
			<template #actions>
				<ActionButton :close-after-click="true"
					@click="addContactsToGroup(group)">
					<template #icon>
						<IconAdd :size="20" />
					</template>
					{{ t('contacts', 'Add contacts') }}
				</ActionButton>
				<ActionInput :value.sync="newGroupName"
					:disabled="renaming"
					@submit="renameGroup">
					<template #icon>
						<IconLoading v-if="renaming" :size="20" />
						<IconRename v-else :size="20" />
					</template>
					{{ t('contacts', 'Rename') }}
				</ActionInput>
				<ActionButton :close-after-click="true"
					@click="downloadGroup(group)">
					<template #icon>
						<IconDownload :size="20" />
					</template>
					{{ t('contacts', 'Export') }}
				</ActionButton>
				<ActionButton @click="emailGroup(group)">
					<template #icon>
						<IconEmail :size="20" />
					</template>
					{{ t('contacts', 'Send email') }}
				</ActionButton>
				<ActionButton @click="emailGroup(group, 'bcc')">
					<template #icon>
						<IconEmail :size="20" />
					</template>
					{{ t('contacts', 'Send email as BCC') }}
				</ActionButton>
				<ActionButton :disabled="deleting" @click="deleteGroup">
					<template #icon>
						<IconLoading v-if="deleting" :size="20" />
						<IconDelete v-else :size="20" />
					</template>
					{{ t('contacts', 'Delete') }}
				</ActionButton>
			</template>

			<template #counter>
				<NcCounterBubble v-if="group.contacts.length > 0">
					{{ group.contacts.length }}
				</NcCounterBubble>
			</template>
		</AppNavigationItem>
	</div>
</template>

<script>
import { emit } from '@nextcloud/event-bus'
import download from 'downloadjs'
import moment from 'moment'
import renameContactFromGroup from '../../services/renameContactFromGroup.js'
import removeContactFromGroup from '../../services/removeContactFromGroup.js'

import {
	NcActionButton as ActionButton,
	NcCounterBubble,
	NcAppNavigationItem as AppNavigationItem,
	NcActionInput as ActionInput,
	NcLoadingIcon as IconLoading,
} from '@nextcloud/vue'
import IconContact from 'vue-material-design-icons/AccountMultiple.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import IconDownload from 'vue-material-design-icons/Download.vue'
import IconEmail from 'vue-material-design-icons/Email.vue'
import IconRename from 'vue-material-design-icons/FolderEdit.vue'
import IconDelete from 'vue-material-design-icons/Delete.vue'
import { showError } from '@nextcloud/dialogs'

export default {
	name: 'GroupNavigationItem',

	components: {
		ActionButton,
		NcCounterBubble,
		AppNavigationItem,
		ActionInput,
		IconContact,
		IconAdd,
		IconDownload,
		IconEmail,
		IconRename,
		IconDelete,
		IconLoading,
	},

	props: {
		group: {
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			newGroupName: '',
			renaming: false,
			deleting: false,
		}
	},

	computed: {
		contacts() {
			return this.$store.getters.getContacts
		},

		isEmpty() {
			return this.group.contacts.length === 0
		},
	},

	methods: {
		isInGroup(groups, groupId) {
			return groups.includes(groupId)
		},
		/**
		 * Drop contact on group handler.
		 *
		 * @param {object} event drop event
		 * @param {object} group to add to dropped contact
		 * @return {Promise<void>}
		 */
		async onDrop(event, group) {
			try {
				const contactFromDropData = JSON.parse(event.dataTransfer.getData('item'))
				const contactFromStore = this.$store.getters.getContact(`${contactFromDropData.uid}~${contactFromDropData.addressbookId}`)
				if (contactFromStore && !this.isInGroup(contactFromStore.groups, group.id)) {
					const contact = this.$store.getters.getContact(`${contactFromDropData.uid}~${contactFromDropData.addressbookId}`)
					await this.$store.dispatch('updateContactGroups', {
						groupNames: [...contactFromStore.groups, group.id],
						contact,
					})
					const localContact = Object.assign(
						Object.create(Object.getPrototypeOf(contact)),
						contact,
					)
					localContact.groups = [...contactFromStore.groups, group.id]
					await this.$store.dispatch('updateContact', localContact)
				}
			} catch (e) {
				console.error(e)
				showError('Tried to drop an invalid contact!')
			} finally {
				event.target.closest('.group-drop-area').removeAttribute('drop-active')
			}
		},
		// Add marker for drop area
		onDragOver(event) {
			event.preventDefault()
			event.target.closest('.group-drop-area').setAttribute('drop-active', true)
		},
		// Remove marker from drop area
		onDragLeave(event) {
			event.target.closest('.group-drop-area').removeAttribute('drop-active')
		},
		// Trigger the entity picker view
		addContactsToGroup() {
			emit('contacts:group:append', this.group.name)
		},

		/**
		 * Download group of contacts
		 *
		 * @param {object} group of contacts to be downloaded
		 */
		downloadGroup(group) {
			// get grouped contacts
			let groupedContacts = {}
			group.contacts.forEach(key => {
				const id = this.contacts[key].addressbook.id
				groupedContacts = Object.assign({
					[id]: {
						addressbook: this.contacts[key].addressbook,
						contacts: [],
					},
				}, groupedContacts)
				groupedContacts[id].contacts.push(this.contacts[key].url)
			})

			// create vcard promise with the requested contacts
			const vcardPromise = Promise.all(
				Object.keys(groupedContacts).map(key =>
					groupedContacts[key].addressbook.dav.addressbookMultigetExport(groupedContacts[key].contacts)))
				.then(response => ({
					groupName: group.name,
					data: response.map(data => data.body).join(''),
				}))

			// download vcard
			this.downloadVcardPromise(vcardPromise)
		},

		/**
		 * Download vcard promise as vcard file
		 *
		 * @param {Promise} vcardPromise the full vcf file promise
		 */
		async downloadVcardPromise(vcardPromise) {
			vcardPromise.then(response => {
				const filename = moment().format('YYYY-MM-DD_HH-mm') + '_' + response.groupName + '.vcf'
				const content = 'data:text/plain;charset=utf-8,' + window.encodeURIComponent(response.data)
				download(content, filename, 'text/vcard')
			})
		},

		/**
		 * Open mailto: for contacts in a group
		 *
		 * @param {object} group of contacts to be emailed
		 * @param {string} mode 'to', 'cc' or 'bcc' header
		 */
		emailGroup(group, mode = 'to') {
			const emails = []
			group.contacts.filter(key => this.contacts[key].email !== null).forEach(key => {
				// The email property could contain "John Doe <john.doe@example.com>", but vcard spec only
				// allows addr-spec, not name-addr, so to stay compliant, replace everything outside of <>
				const email = this.contacts[key].email.replace(/(.*<)([^>]*)(>)/g, '$2').trim()
				const name = this.contacts[key].fullName.replace(/[,<>]/g, '').trim()
				if (email === '') {
					return
				}
				if (name === null || name === '') {
					emails.push(email)
					return
				}
				emails.push(`${name} <${email}>`)
			})
			// We could just do mailto:${emails}, but if we want to use name-addr, not addr-spec, then we
			// have to explicitly set the "to:" or "bcc:" header.
			window.location.href = `mailto:?${mode}=${emails.map(encodeURIComponent).join(',')}`
		},

		/**
		 * Rename group in store and on server
		 */
		async renameGroup() {
			if (this.newGroupName === '') {
				return
			}

			this.renaming = true
			for (const key of this.group.contacts) {
				const contact = this.$store.getters.getContact(key)

				if (contact === undefined) {
					return
				}

				try {
					await renameContactFromGroup(contact, this.group.name, this.newGroupName)
				} catch (e) {
					console.error('Error renaming group', e)
				}
			}

			this.$store.commit('renameGroup', {
				oldGroupName: this.group.name,
				newGroupName: this.newGroupName,
			})
			this.renaming = false
		},

		/**
		 * Delete group from store and on server
		 */
		async deleteGroup() {
			this.deleting = true
			for (const key of this.group.contacts) {
				const contact = this.$store.getters.getContact(key)

				if (contact === undefined) {
					return
				}

				try {
					await removeContactFromGroup(contact, this.group.name)
				} catch (e) {
					console.error('Error deleting group', e)
				}
			}

			this.$store.commit('removeGroup', this.group.name)
			this.deleting = false
		},

	},
}
</script>

<style lang="scss" scoped>
.group-drop-area[drop-active=true] {
	background-color: var(--color-primary-light);
}
</style>
