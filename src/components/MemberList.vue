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
	<AppContentList v-if="!hasMembers" class="members-list">
		<EmptyContent v-if="loading" icon="icon-loading">
			{{ t('contacts', 'Loading members list …') }}
		</EmptyContent>

		<EmptyContent v-else-if="!circle.isMember" icon="icon-contacts-dark">
			{{ t('contacts', 'The list of members is only visible to members of this circle') }}
		</EmptyContent>

		<EmptyContent v-else icon="icon-contacts-dark">
			{{ t('contacts', 'There is no member in this circle') }}
		</EmptyContent>
	</AppContentList>

	<AppContentList v-else :class="{ 'icon-loading': loading, showdetails: showDetails }">
		<div class="members-list__new">
			<button v-if="circle.canManageMembers"
				class="icon-add"
				@click="onShowPicker(circle.id)">
				{{ t('contacts', 'Add members') }}
			</button>
			<button v-if="isMobile"
				class="icon-info"
				@click="showCircleDetails">
				{{ t('contacts', 'Show circle details') }}
			</button>
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
import AppContentList from '@nextcloud/vue/dist/Components/AppContentList'
import EmptyContent from '@nextcloud/vue/dist/Components/EmptyContent'
import isMobile from '@nextcloud/vue/dist/Mixins/isMobile'
import VirtualList from 'vue-virtual-scroll-list'

import MembersListItem from './MembersList/MembersListItem'
import EntityPicker from './EntityPicker/EntityPicker'
import RouterMixin from '../mixins/RouterMixin'

import { getRecommendations, getSuggestions } from '../services/collaborationAutocompletion'
import { showError, showWarning } from '@nextcloud/dialogs'
import { subscribe } from '@nextcloud/event-bus'
import { SHARES_TYPES_MEMBER_MAP, CIRCLES_MEMBER_GROUPING } from '../models/constants.ts'

export default {
	name: 'MemberList',

	components: {
		AppContentList,
		VirtualList,
		EntityPicker,
		EmptyContent,
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
				showError(t('contacts', 'There was an issue adding members to the circle'))
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
			padding-left: 44px;
			background-position: 14px center;
			text-align: left;
			width: 100%;
		}
	}

	&::v-deep .empty-content {
		margin: auto;
	}
}
</style>
