<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppNavigation>
		<template #icon>
			<IconLoading v-if="loading" :size="20" />
		</template>

		<header class="header">
			<slot />
		</header>

		<!-- groups list -->
		<template #list>
			<!-- All contacts group -->
			<AppNavigationItem id="everyone"
				:name="GROUP_ALL_CONTACTS"
				:to="{
					name: 'group',
					params: { selectedGroup: GROUP_ALL_CONTACTS },
				}">
				<template #icon>
					<IconContact :size="20" />
				</template>
				<template #counter>
					<NcCounterBubble v-if="sortedContacts.length">
						{{ sortedContacts.length }}
					</NcCounterBubble>
				</template>
			</AppNavigationItem>

			<!-- Organization chart -->
			<AppNavigationItem v-if="existChart"
				id="chart"
				:name="CHART_ALL_CONTACTS"
				:to="{
					name: 'chart',
					params: { selectedChart: GROUP_ALL_CONTACTS },
				}"
				icon="icon-category-monitoring" />

			<!-- Not grouped group -->
			<AppNavigationItem v-if="ungroupedContacts.length > 0"
				id="notgrouped"
				:name="GROUP_NO_GROUP_CONTACTS"
				:to="{
					name: 'group',
					params: { selectedGroup: GROUP_NO_GROUP_CONTACTS },
				}">
				<template #icon>
					<IconUser :size="20" />
				</template>
				<template #counter>
					<NcCounterBubble v-if="ungroupedContacts.length">
						{{ ungroupedContacts.length }}
					</NcCounterBubble>
				</template>
			</AppNavigationItem>

			<!-- Recently contacted group -->
			<AppNavigationItem v-if="isContactsInteractionEnabled && recentlyContactedContacts && recentlyContactedContacts.contacts.length > 0"
				id="recentlycontacted"
				:name="GROUP_RECENTLY_CONTACTED"
				:to="{
					name: 'group',
					params: { selectedGroup: GROUP_RECENTLY_CONTACTED },
				}">
				<template #icon>
					<IconRecentlyContacted :size="20" />
				</template>
				<template #counter>
					<NcCounterBubble v-if="recentlyContactedContacts.contacts.length">
						{{ recentlyContactedContacts.contacts.length }}
					</NcCounterBubble>
				</template>
			</AppNavigationItem>

			<AppNavigationCaption id="newgroup"
				:force-menu="true"
				:menu-open.sync="isNewGroupMenuOpen"
				:name="t('contacts', 'Contact groups')"
				@click.prevent.stop="toggleNewGroupMenu">
				<template #actionsTriggerIcon>
					<IconAdd :size="20" />
				</template>
				<template #actions>
					<ActionText v-show="isNewGroupMenuOpen">
						<template #icon>
							<IconError v-if="createGroupError" :size="20" />
							<IconContact v-else-if="!createGroupError" :size="20" />
						</template>
						{{ createGroupError ? createGroupError : t('contacts', 'Create a new contact group') }}
					</ActionText>
					<ActionInput v-show="isNewGroupMenuOpen"
						icon=""
						:placeholder="t('contacts','Contact group name')"
						@submit.prevent.stop="createNewGroup" />
				</template>
			</AppNavigationCaption>

			<!-- Custom groups -->
			<GroupNavigationItem v-for="group in ellipsisGroupsMenu"
				:key="group.key"
				:group="group" />

			<template v-if="isCirclesEnabled">
				<!-- Toggle groups ellipsis -->
				<AppNavigationItem v-if="groupsMenu.length > ELLIPSIS_COUNT"
					:name="collapseGroupsTitle"
					class="app-navigation__collapse"
					icon=""
					@click="onToggleGroups" />

				<!-- New circle button caption and modal -->
				<AppNavigationCaption id="newcircle"
					:name="t('contacts', 'Teams')">
					<template #actions>
						<NcActionButton @click="toggleNewCircleModal">
							<template #icon>
								<IconAdd :size="20" />
							</template>
							{{ t('contacts', 'Create a new team') }}
						</NcActionButton>
					</template>
				</AppNavigationCaption>
				<NewCircleIntro v-if="isNewCircleModalOpen"
					:loading="createCircleLoading"
					@close="closeNewCircleIntro"
					@submit="createNewCircle" />

				<template v-if="circlesMenu.length > 0">
					<!-- Circles -->
					<CircleNavigationItem v-for="circle in ellipsisCirclesMenu"
						:key="circle.key"
						:circle="circle" />

					<!-- Toggle circles ellipsis -->
					<AppNavigationItem v-if="circlesMenu.length > ELLIPSIS_COUNT"
						:name="collapseCirclesTitle"
						class="app-navigation__collapse"
						icon=""
						@click="onToggleCircles" />
				</template>

				<p class="app-navigation__circle-desc">
					{{ CIRCLE_DESC }}
				</p>
			</template>
		</template>

		<!-- settings -->

		<template #footer>
			<div class="contacts-settings">
				<AppNavigationItem :aria-label="t('contacts', 'Open the contacts app settings')"
					:name="CONTACTS_SETTINGS"
					@click="showContactsSettings">
					<Cog slot="icon" :size="20" />
				</AppNavigationItem>
			</div>
		</template>
		<ContactsSettings :open.sync="showSettings" />
	</AppNavigation>
</template>

<script>
import { GROUP_ALL_CONTACTS, CHART_ALL_CONTACTS, GROUP_NO_GROUP_CONTACTS, GROUP_RECENTLY_CONTACTED, ELLIPSIS_COUNT, CIRCLE_DESC, CONTACTS_SETTINGS } from '../../models/constants.ts'

import {
	NcActionInput as ActionInput,
	NcActionText as ActionText,
	NcActionButton,
	NcAppNavigation as AppNavigation,
	NcCounterBubble,
	NcAppNavigationItem as AppNavigationItem,
	NcAppNavigationCaption as AppNavigationCaption,
	NcLoadingIcon as IconLoading,
} from '@nextcloud/vue'

import naturalCompare from 'string-natural-compare'

import CircleNavigationItem from './CircleNavigationItem.vue'
import Cog from 'vue-material-design-icons/Cog.vue'
import ContactsSettings from './ContactsSettings.vue'
import GroupNavigationItem from './GroupNavigationItem.vue'
import NewCircleIntro from '../EntityPicker/NewCircleIntro.vue'

import isCirclesEnabled from '../../services/isCirclesEnabled.js'
import isContactsInteractionEnabled from '../../services/isContactsInteractionEnabled.js'
import IconContact from 'vue-material-design-icons/AccountMultiple.vue'
import IconUser from 'vue-material-design-icons/Account.vue'
import IconRecentlyContacted from '../Icons/IconRecentlyContacted.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import IconError from 'vue-material-design-icons/AlertCircle.vue'

import RouterMixin from '../../mixins/RouterMixin.js'
import { showError } from '@nextcloud/dialogs'
import { emit } from '@nextcloud/event-bus'

export default {
	name: 'RootNavigation',

	components: {
		ActionInput,
		ActionText,
		NcActionButton,
		AppNavigation,
		NcCounterBubble,
		AppNavigationItem,
		AppNavigationCaption,
		CircleNavigationItem,
		Cog,
		ContactsSettings,
		GroupNavigationItem,
		IconContact,
		IconUser,
		IconAdd,
		IconError,
		IconLoading,
		IconRecentlyContacted,
		NewCircleIntro,
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
			CIRCLE_DESC,
			CONTACTS_SETTINGS,
			ELLIPSIS_COUNT,
			GROUP_ALL_CONTACTS,
			CHART_ALL_CONTACTS,
			GROUP_NO_GROUP_CONTACTS,
			GROUP_RECENTLY_CONTACTED,

			// create group
			isNewGroupMenuOpen: false,
			createGroupError: null,

			// create circle
			isNewCircleModalOpen: false,
			createCircleLoading: false,
			createCircleError: null,

			isCirclesEnabled,
			isContactsInteractionEnabled,

			collapsedGroups: true,
			collapsedCircles: true,

			showSettings: false,
		}
	},

	computed: {
		// store variables
		circles() {
			return this.$store.getters.getCircles
		},
		contacts() {
			return this.$store.getters.getContacts
		},
		groups() {
			return this.$store.getters.getGroups
		},
		sortedContacts() {
			return this.$store.getters.getSortedContacts
		},

		// list all the contacts that doesn't have a group
		ungroupedContacts() {
			return this.sortedContacts.filter(contact => this.contacts[contact.key].groups && this.contacts[contact.key].groups.length === 0)
		},

		// check if any contact has manager, if not then is no need for organization chart menu
		existChart() {
			return !!Object.keys(this.contacts).filter(key => this.contacts[key].managersName).length
		},

		// generate groups menu from the groups store
		groupsMenu() {
			const menu = this.groups.map(group => {
				return Object.assign({}, group, {
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
		ellipsisGroupsMenu() {
			// If circles is not enabled, we show everything
			if (this.isCirclesEnabled && this.collapsedGroups) {
				return this.groupsMenu.slice(0, ELLIPSIS_COUNT)
			}
			return this.groupsMenu
		},

		// generate circles menu from the circles store
		circlesMenu() {
			const menu = this.circles || []
			menu.sort((a, b) => {
				// If user is member of a and b, sort by level
				if (a?.initiator?.level !== b?.initiator?.level && a?.initiator?.level && b?.initiator?.level) {
					return b.initiator.level - a.initiator.level
				}

				// If user is member of a and not b, sort a first
				if (a.initiator && !b.initiator) {
					return -1
				}

				// If user is member of b and not a, sort b first
				if (!a.initiator && b.initiator) {
					return 1
				}

				// Else we sort by name
				return naturalCompare(a.toString(), b.toString(), { caseInsensitive: true })
			})

			return menu
		},
		ellipsisCirclesMenu() {
			if (this.collapsedCircles) {
				return this.circlesMenu.slice(0, ELLIPSIS_COUNT)
			}
			return this.circlesMenu
		},

		// Recently contacted data
		recentlyContactedContacts() {
			return this.groups.find(group => group.name === GROUP_RECENTLY_CONTACTED)
		},

		// Titles for the ellipsis toggle buttons
		collapseGroupsTitle() {
			return this.collapsedGroups
				? t('contacts', 'Show all groups')
				: t('contacts', 'Collapse groups')
		},
		collapseCirclesTitle() {
			return this.collapsedCircles
				? t('contacts', 'Show all teams')
				: t('contacts', 'Collapse teams')
		},
	},

	methods: {
		toggleNewGroupMenu() {
			this.isNewGroupMenuOpen = !this.isNewGroupMenuOpen
		},
		createNewGroup(e) {
			const input = e.target.querySelector('input[type=text]')
			const groupName = input.value.trim()
			this.logger.debug('Creating new group', { groupName })

			// Check if already exists
			if (this.groups.find(group => group.name === groupName)) {
				this.createGroupError = t('contacts', 'This group already exists')
				emit('contacts:group:append', this.groups.find(group => group.name === groupName).name)
				return
			}

			this.createGroupError = null
			this.logger.debug('Created new local group', { groupName })
			this.$store.dispatch('addGroup', groupName)
			this.isNewGroupMenuOpen = false

			emit('contacts:group:append', groupName)
		},

		// Ellipsis item toggles
		onToggleGroups() {
			this.collapsedGroups = !this.collapsedGroups
		},
		onToggleCircles() {
			this.collapsedCircles = !this.collapsedCircles
		},

		toggleNewCircleModal() {
			this.isNewCircleModalOpen = true
		},
		async createNewCircle(circleName, isPersonal, isLocal) {
			this.logger.debug('Creating new team', { circleName })

			this.createCircleLoading = true

			// Check if already exists
			if (this.circles.find(circle => circle.name === circleName)) {
				this.createCircleError = t('contacts', 'This team already exists')
				return
			}
			this.createCircleError = null

			try {
				const circle = await this.$store.dispatch('createCircle', { circleName, isPersonal, isLocal })
				this.closeNewCircleIntro()

				// Select group
				this.$router.push({
					name: 'circle',
					params: {
						selectedCircle: circle.id,
					},
				})
			} catch (error) {
				showError(t('contacts', 'An error happened during the creation of the team'))
			} finally {
				this.createCircleLoading = false
			}
		},
		closeNewCircleIntro() {
			this.isNewCircleModalOpen = false
		},

		/**
		 * Shows the contacts settings
		 */
		showContactsSettings() {
			this.showSettings = true
		},
	},
}
</script>

<style lang="scss" scoped>
$caption-padding: 22px;

.header {
	padding: calc(var(--default-grid-baseline, 4px) * 2);
}

#newgroup,
#newcircle {
	margin-top: $caption-padding;

	:deep(a) {
		color: var(--color-text-maxcontrast)
	}
}

.app-navigation__circle-desc {
	margin: 0 $caption-padding;
}

.app-navigation__collapse :deep(a) {
	color: var(--color-text-maxcontrast)
}

:deep(.settings-button__label) {
	opacity: .7;
	font-weight: bold;
}

.contacts-settings {
	padding: calc(var(--default-grid-baseline, 4px) * 2);
}

.contacts-settings-button {
	width: 100%;
	justify-content: start !important;
}
</style>
