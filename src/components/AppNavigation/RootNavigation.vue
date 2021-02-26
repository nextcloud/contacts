<template>
	<AppNavigation>
		<slot />

		<!-- groups list -->
		<template v-if="!loading" #list>
			<!-- All contacts group -->
			<AppNavigationItem id="everyone"
				:title="GROUP_ALL_CONTACTS"
				:to="{
					name: 'group',
					params: { selectedGroup: GROUP_ALL_CONTACTS },
				}"
				icon="icon-contacts-dark">
				<AppNavigationCounter v-if="sortedContacts.length" slot="counter">
					{{ sortedContacts.length }}
				</AppNavigationCounter>
			</AppNavigationItem>

			<!-- Not grouped group -->
			<AppNavigationItem
				v-if="ungroupedContacts.length > 0"
				id="notgrouped"
				:title="GROUP_NO_GROUP_CONTACTS"
				:to="{
					name: 'group',
					params: { selectedGroup: GROUP_NO_GROUP_CONTACTS },
				}"
				icon="icon-user">
				<AppNavigationCounter v-if="ungroupedContacts.length" slot="counter">
					{{ ungroupedContacts.length }}
				</AppNavigationCounter>
			</AppNavigationItem>

			<!-- Recently contacted group -->
			<AppNavigationItem
				v-if="isContactsInteractionEnabled && recentlyContactedContacts && recentlyContactedContacts.contacts.length > 0"
				id="recentlycontacted"
				:title="GROUP_RECENTLY_CONTACTED"
				:to="{
					name: 'group',
					params: { selectedGroup: GROUP_RECENTLY_CONTACTED },
				}"
				icon="icon-recent-actors">
				<AppNavigationCounter v-if="recentlyContactedContacts.contacts.length" slot="counter">
					{{ recentlyContactedContacts.contacts.length }}
				</AppNavigationCounter>
			</AppNavigationItem>

			<AppNavigationSpacer />

			<!-- Custom groups -->
			<AppNavigationItem v-for="group in groupsMenu"
				:key="group.key"
				:to="group.router"
				:title="group.name"
				:icon="group.icon">
				<template slot="actions">
					<ActionButton
						icon="icon-add"
						@click="addContactsToGroup(group)">
						{{ t('contacts', 'Add contacts') }}
					</ActionButton>
					<ActionButton
						icon="icon-download"
						@click="downloadGroup(group)">
						{{ t('contacts', 'Download') }}
					</ActionButton>
				</template>

				<AppNavigationCounter v-if="group.contacts.length > 0" slot="counter">
					{{ group.contacts.length }}
				</AppNavigationCounter>
			</AppNavigationItem>

			<AppNavigationItem
				id="newgroup"
				:force-menu="true"
				:menu-open.sync="isNewGroupMenuOpen"
				:title="t('contacts', '+ New group')"
				menu-icon="icon-add"
				@click.prevent.stop="toggleNewGroupMenu">
				<template slot="actions">
					<ActionText :icon="createGroupError ? 'icon-error' : 'icon-contacts-dark'">
						{{ createGroupError ? createGroupError : t('contacts', 'Create a new group') }}
					</ActionText>
					<ActionInput
						icon=""
						:placeholder="t('contacts','Group name')"
						@submit.prevent.stop="createNewGroup" />
				</template>
			</AppNavigationItem>
		</template>

		<!-- settings -->
		<template #footer>
			<AppNavigationSettings v-if="!loading">
				<SettingsSection />
			</AppNavigationSettings>
		</template>
	</AppNavigation>
</template>

<script>
import { GROUP_ALL_CONTACTS, GROUP_NO_GROUP_CONTACTS, GROUP_RECENTLY_CONTACTED } from '../../models/groups'

import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import ActionInput from '@nextcloud/vue/dist/Components/ActionInput'
import ActionText from '@nextcloud/vue/dist/Components/ActionText'
import AppNavigation from '@nextcloud/vue/dist/Components/AppNavigation'
import AppNavigationCounter from '@nextcloud/vue/dist/Components/AppNavigationCounter'
import AppNavigationItem from '@nextcloud/vue/dist/Components/AppNavigationItem'
import AppNavigationSettings from '@nextcloud/vue/dist/Components/AppNavigationSettings'
import AppNavigationSpacer from '@nextcloud/vue/dist/Components/AppNavigationSpacer'

import download from 'downloadjs'
import moment from 'moment'
import naturalCompare from 'string-natural-compare'

import SettingsSection from './SettingsSection'
import isContactsInteractionEnabled from '../../services/isContactsInteractionEnabled'

export default {
	name: 'RootNavigation',

	components: {
		ActionButton,
		ActionInput,
		ActionText,
		AppNavigation,
		AppNavigationCounter,
		AppNavigationItem,
		AppNavigationSettings,
		AppNavigationSpacer,
		SettingsSection,
	},

	props: {
		loading: {
			type: Boolean,
			default: true,
		},

		selectedGroup: {
			type: String,
			default: undefined,
		},
		selectedContact: {
			type: String,
			default: undefined,
		},

		contactsList: {
			type: Array,
			required: true,
		},
	},

	data() {
		return {
			GROUP_ALL_CONTACTS,
			GROUP_NO_GROUP_CONTACTS,
			GROUP_RECENTLY_CONTACTED,

			// Create group
			isNewGroupMenuOpen: false,
			createGroupError: null,

			isContactsInteractionEnabled,
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

		ungroupedContacts() {
			return this.sortedContacts.filter(contact => this.contacts[contact.key].groups && this.contacts[contact.key].groups.length === 0)
		},

		// generate groups menu from groups store
		groupsMenu() {
			const menu = this.groups.map(group => {
				return Object.assign(group, {
					id: group.name.replace(' ', '_'),
					key: group.name.replace(' ', '_'),
					router: {
						name: 'group',
						params: { selectedGroup: group.name },
					},
					toString: () => group.name,
				})
			})
			menu.sort((a, b) => naturalCompare(a.toString(), b.toString(), { caseInsensitive: true }))

			// Find the Recently Contacted group, delete it from array
			const recentlyIndex = menu.findIndex(group => group.name === GROUP_RECENTLY_CONTACTED)
			if (recentlyIndex >= 0) {
				menu.splice(recentlyIndex, 1)
			}

			return menu
		},

		// Recently contacted data
		recentlyContactedContacts() {
			return this.groups.find(group => group.name === GROUP_RECENTLY_CONTACTED)
		},
	},

	methods: {
		/**
		 * Download group of contacts
		 *
		 * @param {Object} group of contacts to be downloaded
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
				download(response.data, filename, 'text/vcard')
			})
		},

		/**
		 * Forward the addContactsToGroup event to the parent
		 */
		addContactsToGroup() {
			this.$emit('addContactsToGroup', ...arguments)
		},

		toggleNewGroupMenu() {
			this.isNewGroupMenuOpen = !this.isNewGroupMenuOpen
		},
		createNewGroup(e) {
			const input = e.target.querySelector('input[type=text]')
			const groupName = input.value.trim()

			// Check if already exists
			if (this.groups.find(group => group.name === groupName)) {
				this.createGroupError = t('contacts', 'This group already exists')
				return
			}

			this.createGroupError = null

			console.debug('Created new local group', groupName)
			this.$store.dispatch('addGroup', groupName)
			this.isNewGroupMenuOpen = false

			// Select group
			this.$router.push({
				name: 'group',
				params: {
					selectedGroup: groupName,
				},
			})
		},
	},
}
</script>
