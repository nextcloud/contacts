<!--
  - @copyright Copyright (c) 2021 John Molakvoæ <skjnldsv@protonmail.com>
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
	<AppNavigation :class="{'icon-loading': loading}">
		<slot />

		<!-- groups list -->
		<template #list>
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

			<AppNavigationCaption
				id="newgroup"
				:force-menu="true"
				:menu-open.sync="isNewGroupMenuOpen"
				:title="t('contacts', 'Groups')"
				default-icon="icon-add"
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
			</AppNavigationCaption>

			<!-- Custom groups -->
			<GroupNavigationItem
				v-for="group in ellipsisGroupsMenu"
				:key="group.key"
				:group="group" />

			<template v-if="isCirclesEnabled">
				<!-- Toggle groups ellipsis -->
				<AppNavigationItem
					v-if="groupsMenu.length > ELLIPSIS_COUNT"
					:title="collapseGroupsTitle"
					class="app-navigation__collapse"
					icon=""
					@click="onToggleGroups" />

				<!-- New circle button caption and modal -->
				<AppNavigationCaption
					id="newcircle"
					:title="t('contacts', 'Circles')"
					@click.prevent.stop="toggleNewCircleModal">
					<template slot="actions">
						<ActionButton icon="icon-add" @click="toggleNewCircleModal">
							{{ t('contacts', 'Create a new circle') }}
						</ActionButton>
					</template>
				</AppNavigationCaption>
				<NewCircleIntro v-if="isNewCircleModalOpen"
					:loading="createCircleLoading"
					@close="closeNewCircleIntro"
					@submit="createNewCircle" />

				<template v-if="circlesMenu.length > 0">
					<!-- Circles -->
					<CircleNavigationItem
						v-for="circle in ellipsisCirclesMenu"
						:key="circle.key"
						:circle="circle" />

					<!-- Toggle circles ellipsis -->
					<AppNavigationItem
						v-if="circlesMenu.length > ELLIPSIS_COUNT"
						:title="collapseCirclesTitle"
						class="app-navigation__collapse"
						icon=""
						@click="onToggleCircles" />
				</template>

				<p v-else-if="!loading"
					class="app-navigation__circle-desc">
					{{ CIRCLE_DESC }}
				</p>
			</template>
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
import { GROUP_ALL_CONTACTS, GROUP_NO_GROUP_CONTACTS, GROUP_RECENTLY_CONTACTED, ELLIPSIS_COUNT, CIRCLE_DESC } from '../../models/constants.ts'

import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import ActionInput from '@nextcloud/vue/dist/Components/ActionInput'
import ActionText from '@nextcloud/vue/dist/Components/ActionText'
import AppNavigation from '@nextcloud/vue/dist/Components/AppNavigation'
import AppNavigationCounter from '@nextcloud/vue/dist/Components/AppNavigationCounter'
import AppNavigationItem from '@nextcloud/vue/dist/Components/AppNavigationItem'
import AppNavigationSettings from '@nextcloud/vue/dist/Components/AppNavigationSettings'
import AppNavigationCaption from '@nextcloud/vue/dist/Components/AppNavigationCaption'

import naturalCompare from 'string-natural-compare'

import CircleNavigationItem from './CircleNavigationItem'
import GroupNavigationItem from './GroupNavigationItem'
import NewCircleIntro from '../EntityPicker/NewCircleIntro'
import SettingsSection from './SettingsSection'

import isCirclesEnabled from '../../services/isCirclesEnabled'
import isContactsInteractionEnabled from '../../services/isContactsInteractionEnabled'

import RouterMixin from '../../mixins/RouterMixin'
import { showError } from '@nextcloud/dialogs'

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
		AppNavigationCaption,
		CircleNavigationItem,
		GroupNavigationItem,
		NewCircleIntro,
		SettingsSection,
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
			ELLIPSIS_COUNT,
			GROUP_ALL_CONTACTS,
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
					icon: 'icon-group',
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
			menu.sort((a, b) => naturalCompare(a.toString(), b.toString(), { caseInsensitive: true }))

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
				? t('contacts', 'Show all circles')
				: t('contacts', 'Collapse circles')
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
				return
			}

			this.createGroupError = null

			this.logger.debug('Created new local group', { groupName })
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
			this.logger.debug('Creating new circle', { circleName })

			this.createCircleLoading = true

			// Check if already exists
			if (this.circles.find(circle => circle.name === circleName)) {
				this.createCircleError = t('contacts', 'This circle already exists')
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
				showError(t('contacts', 'An error happened during the creation of the circle'))
			} finally {
				this.createCircleLoading = false
			}
		},
		closeNewCircleIntro() {
			this.isNewCircleModalOpen = false
		},
	},
}
</script>

<style lang="scss" scoped>
$caption-padding: 22px;

#newgroup,
#newcircle {
	margin-top: $caption-padding;

	::v-deep a {
		color: var(--color-text-maxcontrast)
	}
}

.app-navigation__circle-desc {
	margin: 0 $caption-padding;
}

.app-navigation__collapse ::v-deep a {
	color: var(--color-text-maxcontrast)
}

// Change icon opacity for a better soothing visual
.app-navigation-entry ::v-deep {
	.app-navigation-entry-icon.icon-group,
	.app-navigation-entry-icon.icon-circles {
		opacity: .6;
	}
}
</style>
