<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppContentList v-if="!hasMembers" class="members-list">
		<template v-if="loading">
			<EmptyContent class="empty-content" :name="t('contacts', 'Loading members list …')">
				<template #icon>
					<IconLoading :size="20" />
				</template>
			</EmptyContent>
		</template>
		<template v-else-if="!circle.isMember">
			<EmptyContent class="empty-content" :name="t('contacts', 'The list of members is only visible to members of this team')">
				<template #icon>
					<IconContact :size="20" />
				</template>
			</EmptyContent>
		</template>
		<template v-else>
			<EmptyContent class="empty-content" :name="t('contacts', 'You currently have no access to the member list')">
				<template #icon>
					<IconContact :size="20" />
				</template>
			</EmptyContent>
		</template>
	</AppContentList>

	<AppContentList v-else :class="{ showdetails: showDetails }">
		<div class="members-list__new">
			<Button v-if="circle.canManageMembers"
				@click="onShowPicker(circle.id)">
				<template #icon>
					<IconLoading v-if="loading" />
					<IconAdd :size="20" />
				</template>
				{{ t('contacts', 'Add members') }}
			</Button>
			<Button v-if="isMobile"
				@click="showCircleDetails">
				<template #icon>
					<IconInfo :size="20" />
				</template>
				{{ t('contacts', 'Show team details') }}
			</Button>
		</div>

		<VirtualList class="members-list"
			data-key="id"
			:data-sources="filteredList"
			:data-component="MembersListItem"
			:estimate-size="68" />

		<!-- member picker -->
		<EntityPicker v-if="showPicker"
			:confirm-label="t('contacts', 'Add to {circle}', { circle: circle.displayName })"
			:data-types="pickerTypes"
			:data-set="filteredPickerData"
			:internal-search="false"
			:loading="pickerLoading"
			:selection.sync="pickerSelection"
			@close="resetPicker"
			@search="onSearch"
			@submit="onPickerPick" />
	</AppContentList>
</template>

<script>
import {
	NcAppContentList as AppContentList,
	NcButton as Button,
	NcEmptyContent as EmptyContent,
	NcLoadingIcon as IconLoading,
	isMobile,
} from '@nextcloud/vue'
import VirtualList from 'vue-virtual-scroll-list'

import MembersListItem from './MembersList/MembersListItem.vue'
import EntityPicker from './EntityPicker/EntityPicker.vue'
import IconContact from 'vue-material-design-icons/AccountMultiple.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import IconInfo from 'vue-material-design-icons/InformationOutline.vue'
import RouterMixin from '../mixins/RouterMixin.js'

import { getRecommendations, getSuggestions } from '../services/collaborationAutocompletion.js'
import { showError, showWarning } from '@nextcloud/dialogs'
import { subscribe } from '@nextcloud/event-bus'
import { SHARES_TYPES_MEMBER_MAP, CIRCLES_MEMBER_GROUPING } from '../models/constants.ts'

export default {
	name: 'MemberList',

	components: {
		AppContentList,
		Button,
		VirtualList,
		EntityPicker,
		EmptyContent,
		IconContact,
		IconAdd,
		IconInfo,
		IconLoading,
	},
	mixins: [isMobile, RouterMixin],

	props: {
		list: {
			type: Array,
			required: true,
		},

		loading: {
			type: Boolean,
			default: false,
		},

		showDetails: {
			type: Boolean,
			default: false,
		},
	},

	data() {
		return {
			MembersListItem,

			pickerLoading: false,
			showPicker: false,
			showPickerIntro: true,

			recommendations: [],
			pickerCircle: null,
			pickerData: [],
			pickerSelection: {},
			pickerTypes: CIRCLES_MEMBER_GROUPING,
		}
	},

	computed: {
		/**
		 * Return the current circle
		 *
		 * @return {Circle}
		 */
		circle() {
			return this.$store.getters.getCircle(this.selectedCircle)
		},

		groupedList() {
			// Group per userType
			return this.list.reduce(function(list, member) {
				const userType = member.userType
				list[userType] = list[userType] || []
				list[userType].push(member)
				return list
			}, Object.create(null))
		},

		filteredList() {
			return Object.keys(this.groupedList)
				// Object.keys returns string
				.map(type => parseInt(type, 10))
				// Map populated types to the group entry
				.map(type => CIRCLES_MEMBER_GROUPING.find(group => group.type === type))
				// Removed undefined group
				.filter(group => group !== undefined)
				// Injecting headings
				.map(group => {
					return [{
						heading: true,
						...group,
					}, ...(this.groupedList[group.type] || [])]
				})
				// Merging sub-arrays
				.flat()
		},

		hasMembers() {
			return this.filteredList.length > 0
		},

		filteredPickerData() {
			return this.pickerData.filter(entity => {
				const type = SHARES_TYPES_MEMBER_MAP[entity.shareType]
				const list = this.groupedList[type]
				if (list) {
					return list.find(member => member.userId === entity.shareWith) === undefined
				}
				// If the type doesn't exists, there is no member of this type
				return true
			})
		},
	},

	mounted() {
		subscribe('contacts:circles:append', this.onShowPicker)
	},

	methods: {
		/**
		 * Show picker and fetch for recommendations
		 * Cache the circleId in case the url change or something
		 * and make sure we add them to the desired circle.
		 *
		 * @param {string} circleId the circle id to add members to
		 */
		async onShowPicker(circleId) {
			this.showPicker = true
			this.pickerLoading = true
			this.pickerCircle = circleId

			try {
				const results = await getRecommendations()
				// cache recommendations
				this.recommendations = results
				this.pickerData = results
			} catch (error) {
				console.error('Unable to get the recommendations list', error)
				// Do not show the error, let the user search
				// showError(t('contacts', 'Unable to get the recommendations list'))
			} finally {
				this.pickerLoading = false
			}
		},

		/**
		 * On EntityPicker search.
		 * Returns recommendations if empty
		 *
		 * @param {string} term the searched term
		 */
		async onSearch(term) {
			if (term.trim() === '') {
				this.pickerData = this.recommendations
				return
			}

			this.pickerLoading = true

			try {
				const results = await getSuggestions(term)
				this.pickerData = results
			} catch (error) {
				console.error('Unable to get the results', error)
				showError(t('contacts', 'Unable to get the results'))
			} finally {
				this.pickerLoading = false
			}
		},

		/**
		 * On picker submit
		 *
		 * @param {Array} selection the selection to add to the circle
		 */
		async onPickerPick(selection) {
			this.logger.info('Adding selection to circle', { selection, pickerCircle: this.pickerCircle })

			this.pickerLoading = true

			selection = selection.map(entry => ({
				id: entry.shareWith,
				type: SHARES_TYPES_MEMBER_MAP[entry.shareType],
			}))

			try {
				const members = await this.$store.dispatch('addMembersToCircle', { circleId: this.pickerCircle, selection })

				if (members.length !== selection.length) {
					showWarning(t('contacts', 'Some members could not be added'))
					// TODO filter successful members and edit selection
					this.pickerSelection = {}
					return
				}

				this.resetPicker()
			} catch (error) {
				showError(t('contacts', 'There was an issue adding members to the team'))
				console.error('There was an issue adding members to the circle', this.pickerCircle, error)
			} finally {
				this.pickerLoading = false
			}
		},

		/**
		 * Reset picker related variables
		 */
		resetPicker() {
			this.showPicker = false
			this.pickerCircle = null
			this.pickerData = []
			this.pickerSelection = {}
		},

		showCircleDetails() {
			this.$emit('update:showDetails', true)
		},
	},
}
</script>

<style lang="scss" scoped>
.members-list {
	// Make virtual scroller scrollable
	max-height: 100%;
	overflow: auto;

	&__new {
		padding: 10px;

		button {
			height: 44px;
			background-position: 14px center;
			text-align: left;
			width: 100%;
		}
	}

	:deep(.empty-content) {
		margin: auto;
	}
}

.empty-content {
	height: 100%;
}
</style>
