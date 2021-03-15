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
	<AppContentList>
		<div class="members-list__new">
			<button class="icon-add" @click="onShowPicker(circle.id)">
				{{ t('contacts', 'Add members') }}
			</button>
		</div>

		<VirtualList class="members-list"
			data-key="id"
			:data-sources="list"
			:data-component="MembersListItem"
			:estimate-size="68" />

		<!-- member picker -->
		<EntityPicker v-if="showPicker"
			:confirm-label="t('contacts', 'Add to {circle}', { circle: circle.displayName})"
			:data-types="pickerTypes"
			:data-set="pickerData"
			:loading="pickerLoading"
			:selection.sync="pickerSelection"
			@close="resetPicker"
			@search="onSearch"
			@submit="onPickerPick" />
	</AppContentList>
</template>

<script>
import AppContentList from '@nextcloud/vue/dist/Components/AppContentList'
import Actions from '@nextcloud/vue/dist/Components/Actions'
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import VirtualList from 'vue-virtual-scroll-list'

import MembersListItem from './MembersList/MembersListItem'
import EntityPicker from './EntityPicker/EntityPicker'
import RouterMixin from '../mixins/RouterMixin'

import { getRecommendations, getSuggestions } from '../services/collaborationAutocompletion'
import { showError, showWarning } from '@nextcloud/dialogs'
import { subscribe } from '@nextcloud/event-bus'
import { SHARES_TYPES_MEMBER_MAP } from '../models/constants.ts'

export default {
	name: 'MemberList',

	components: {
		Actions,
		ActionButton,
		AppContentList,
		VirtualList,
		EntityPicker,
	},
	mixins: [RouterMixin],

	props: {
		list: {
			type: Array,
			required: true,
		},
	},

	data() {
		return {
			MembersListItem,
			pickerLoading: false,
			showPicker: false,

			recommendations: [],
			pickerCircle: null,
			pickerData: [],
			pickerSelection: {},
			pickerTypes: [{
				id: `picker-${OC.Share.SHARE_TYPE_USER}`,
				label: t('contacts', 'Users'),
			}, {
				id: `picker-${OC.Share.SHARE_TYPE_GROUP}`,
				label: t('contacts', 'Groups'),
			}, {
				id: `picker-${OC.Share.SHARE_TYPE_CIRCLE}`,
				label: t('contacts', 'Circles'),
			}, {
				id: `picker-${OC.Share.SHARE_TYPE_EMAIL}`,
				label: t('contacts', 'Email'),
			}],
		}
	},

	computed: {
		/**
		 * Return the current circle
		 * @returns {Circle}
		 */
		circle() {
			return this.$store.getters.getCircle(this.selectedCircle)
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
		 * @param {Array} selection the selection to add to the circle
		 */
		async onPickerPick(selection) {
			console.info('Adding selection to circle', selection, this.pickerCircle)

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
					this.selection = []
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
		},
	},
}
</script>

<style lang="scss" scoped>
.app-content-list {
	flex: 1 1 300px;
	// Cancel scrolling
	overflow: visible;

	.empty-content {
		padding: 20px;
	}
}

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
}
</style>
