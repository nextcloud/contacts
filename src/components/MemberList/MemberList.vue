<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<section class="member-list">
		<ContentHeading>
			{{ t('contacts', 'Team members') }}
		</ContentHeading>

		<NcEmptyContent v-if="loading" class="empty-content" :name="t('contacts', 'Loading members list …')">
			<template #icon>
				<IconLoading :size="20" />
			</template>
		</NcEmptyContent>

		<NcEmptyContent v-else-if="!circle.isMember"
			class="empty-content"
			:name="t('contacts', 'The list of members is only visible to members of this team')">
			<template #icon>
				<IconContact :size="20" />
			</template>
		</NcEmptyContent>

		<NcEmptyContent v-else-if="!hasMembers"
			class="empty-content"
			:name="t('contacts', 'You currently have no access to the member list')">
			<template #icon>
				<IconContact :size="20" />
			</template>
		</NcEmptyContent>

		<div v-else>
			<div class="member-list__new">
				<NcButton v-if="circle.canManageMembers"
					@click="onShowPicker(circle.id)">
					<template #icon>
						<NcLoadingIcon v-if="loading" />
						<IconAdd v-else :size="20" />
					</template>
					{{ t('contacts', 'Add members') }}
				</NcButton>
			</div>

			<MemberListGroup v-for="group, index in groupedList"
				:key="`member-list-group-${index}`"
				v-bind="group" />
		</div>

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
	</section>
</template>

<script lang="ts">
import {
	NcButton,
	NcEmptyContent,
	NcLoadingIcon,
	isMobile,
} from '@nextcloud/vue'

import MemberListGroup from './MemberListGroup.vue'
import EntityPicker from '../EntityPicker/EntityPicker.vue'
import IconContact from 'vue-material-design-icons/AccountMultiple.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import RouterMixin from '../../mixins/RouterMixin.js'

import { showError, showWarning } from '@nextcloud/dialogs'
import { subscribe } from '@nextcloud/event-bus'
import { t } from '@nextcloud/l10n'
import { getRecommendations, getSuggestions } from '../../services/collaborationAutocompletion.js'
import { SHARES_TYPES_MEMBER_MAP, CIRCLES_MEMBER_GROUPING } from '../../models/constants'
import Circle from '../../models/circle.js'
import { defineComponent } from 'vue'

export default defineComponent({
	name: 'MemberList',

	components: {
		EntityPicker,
		IconContact,
		IconAdd,
		MemberListGroup,
		NcButton,
		NcEmptyContent,
		NcLoadingIcon,
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
	},

	data() {
		return {
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

		circle(): Circle {
			return this.$store.getters.getCircle(this.selectedCircle)
		},

		hasMembers() {
			return this.groupedList.length > 0
		},

		filteredPickerData() {
			return this.pickerData.filter(entity => {
				const type = SHARES_TYPES_MEMBER_MAP[entity.shareType]
				const list = this.list.filter(({ userType }) => userType === type)
				if (list) {
					return list.find((member) => member.userId === entity.shareWith) === undefined
				}
				// If the type doesn't exists, there is no member of this type
				return true
			})
		},

		groupedList() {
			return CIRCLES_MEMBER_GROUPING
				.map(({ labelStandalone, type }) => ({
					type,
					label: labelStandalone,
					members: [...this.list.filter(({ userType }) => userType === type)],
				}))
				.filter(({ members }) => members.length > 0)
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

				if (members.length < selection.length) {
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
	},
})
</script>

<style lang="scss" scoped>
.member-list {
	// Make virtual scroller scrollable
	max-height: 100%;
	max-width: 900px;
	overflow: auto;

	&__new {
		padding: 10px;
		display: inline-flex;

		button {
			background-position: 14px center;
			text-align: left;

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
