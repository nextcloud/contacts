<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<section class="member-list">
		<NcEmptyContent
			v-if="!circle.isMember"
			class="empty-content"
			:name="t('contacts', 'The list of members is only visible to members of this team')">
			<template #icon>
				<IconContact :size="20" />
			</template>
		</NcEmptyContent>

		<template v-else>
			<div class="member-list__filters" :class="{ 'member-list__filters--mobile': isMobile }">
				<NcTextField
					v-model="searchQuery"
					class="member-list__search"
					:label="t('contacts', 'Search among current members')"
					trailing-button-icon="close"
					:show-trailing-button="searchQuery !== ''"
					@trailing-button-click="searchQuery = ''">
					<template #icon>
						<IconSearch :size="20" />
					</template>
				</NcTextField>

				<NcSelect
					v-model="searchRole"
					:options="roles"
					:placeholder="t('contacts', 'Role')"
					:multiple="false"
					style="min-width: 160px;" />
			</div>

			<NcEmptyContent
				v-if="loading || loadingList"
				class="empty-content"
				:name="t('contacts', 'Loading members list …')">
				<template #icon>
					<NcLoadingIcon :size="20" />
				</template>
			</NcEmptyContent>

			<NcEmptyContent
				v-else-if="!hasMembers"
				class="empty-content"
				:name="hasActiveFilters ? t('contacts', 'No members found matching your search') : t('contacts', 'You currently have no access to the member list')">
				<template #icon>
					<IconContact :size="20" />
				</template>
			</NcEmptyContent>

			<template v-else>
				<div class="member-list__virtual" :style="virtualListStyle">
					<Virtualizer
						v-slot="{ item }"
						:data="flatList">
						<MemberGridItem
							:key="`member-grid-item-${item.id}`"
							:member="item"
							:is-team="!item.isUser" />
					</Virtualizer>

					<NcNoteCard v-if="isMembersLisTooLarge" type="warning" class="member-list__too-large">
						{{ t('contacts', 'Users list too large. Please adjust your filters.') }}
						<NcButton variant="primary" @click="onLoadAllMembers">
							{{ t('contacts', 'Load all members') }}
						</NcButton>
					</NcNoteCard>
				</div>
			</template>
		</template>

		<!-- member picker -->
		<EntityPicker
			v-if="showPicker"
			ref="entityPicker"
			v-model:selection="pickerSelection"
			:confirm-label="t('contacts', 'Add to {team}', { team: decodedTeamName })"
			:title-label="t('contacts', 'Invite members to {team}', { team: decodedTeamName })"
			:data-types="pickerTypes"
			:data-set="filteredPickerData"
			:internal-search="false"
			:loading="pickerLoading"
			@close="resetPicker"
			@search="onSearch"
			@submit="onPickerPick" />
	</section>
</template>

<script lang="ts">
import { showError, showWarning } from '@nextcloud/dialogs'
import { subscribe } from '@nextcloud/event-bus'
import { NcButton, NcEmptyContent, NcLoadingIcon, NcNoteCard, NcSelect, NcTextField } from '@nextcloud/vue'
import { refDebounced } from '@vueuse/core'
import { Virtualizer } from 'virtua/vue'
import { defineComponent, readonly, ref } from 'vue'
import IconContact from 'vue-material-design-icons/AccountMultipleOutline.vue'
import IconSearch from 'vue-material-design-icons/Magnify.vue'
import EntityPicker from '../EntityPicker/EntityPicker.vue'
import MemberGridItem from './MemberGridItem.vue'
import IsMobileMixin from '../../mixins/IsMobileMixin.ts'
import RouterMixin from '../../mixins/RouterMixin.js'
import {
	CIRCLES_MEMBER_GROUPING,
	CIRCLES_MEMBER_LEVELS,
	MAX_MEMBERS_TO_RENDER,
	MemberLevels,
	SHARES_TYPES_MEMBER_MAP,
} from '../../models/constants.ts'
import { getRecommendations, getSuggestions } from '../../services/collaborationAutocompletion.js'

export default defineComponent({
	name: 'MemberList',

	components: {
		IconSearch,
		NcButton,
		NcNoteCard,
		NcSelect,
		NcTextField,
		EntityPicker,
		IconContact,
		MemberGridItem,
		NcEmptyContent,
		Virtualizer,
		NcLoadingIcon,
	},

	mixins: [IsMobileMixin, RouterMixin],

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

	setup() {
		const searchQuery = ref('')
		const searchQueryDebounced = refDebounced(searchQuery, 500)

		const searchRole = ref(null)
		const roles = Object.entries(CIRCLES_MEMBER_LEVELS).map(([id, label]) => ({
			id: Number(id),
			label,
		}))
		roles.unshift({
			id: Number(MemberLevels.NONE),
			label: t('contacts', 'Pending'),
		})

		return {
			searchQuery,
			searchQueryDebounced,
			searchRole,
			roles: readonly(roles),
		}
	},

	data() {
		return {
			loadingList: false,
			pickerLoading: false,
			showPicker: false,
			showPickerIntro: true,

			recommendations: [],
			pickerCircle: null,
			pickerData: [],
			pickerSelection: {},
			pickerTypes: CIRCLES_MEMBER_GROUPING,

			circleHeaderHeight: 0,
			loadAllMembers: false,
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

		members() {
			return Object.values(this.$store.getters.getCircle(this.circle.id)?.members || [])
		},

		isMembersLisTooLarge() {
			return !this.loadAllMembers && this.flatList.length > MAX_MEMBERS_TO_RENDER
		},

		// Decode HTML entities in the circle display name so apostrophes (') and other
		// HTML-encoded chars (e.g. &#39;) are shown correctly in the picker labels.
		decodedTeamName(): string {
			const raw = this.circle && this.circle.displayName ? this.circle.displayName : ''
			// Use a DOM textarea element to decode HTML entities safely.
			// This works for common entities such as &amp;, &lt;, &gt;, &#39;, etc.
			const ta = document.createElement('textarea')
			ta.innerHTML = raw
			return ta.value
		},

		filteredPickerData() {
			return this.pickerData.filter((entity) => {
				const type = SHARES_TYPES_MEMBER_MAP[entity.shareType]
				const list = this.list.filter(({ userType }) => userType === type)
				if (list) {
					return list.find((member) => member.userId === entity.shareWith) === undefined
				}
				// If the type doesn't exists, there is no member of this type
				return true
			})
		},

		flatList() {
			const teams = this.list.filter((member) => !member.isUser)
			const users = this.list.filter((member) => member.isUser)
			return [...teams, ...users]
		},

		hasMembers() {
			return this.flatList.length > 0
		},

		hasActiveFilters() {
			return this.searchQuery !== '' || this.searchRole !== null
		},

		virtualListStyle() {
			const gridBaseline = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--default-grid-baseline')) || 4
			const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 50
			const padding = gridBaseline * 32
			const availableHeight = window.innerHeight - headerHeight - this.circleHeaderHeight - padding
			return {
				height: `${Math.max(availableHeight, 200)}px`,
			}
		},
	},

	watch: {
		searchQueryDebounced() {
			this.loadAllMembers = false
			this.fetchCircleMembers()
		},

		searchRole() {
			this.loadAllMembers = false
			this.fetchCircleMembers()
		},

		'circle.id': {
			handler() {
				this.fetchCircleMembers()
			},

			immediate: true,
		},
	},

	mounted() {
		subscribe('contacts:circles:append', this.onShowPicker)
		subscribe('guests:user:created', this.onGuestCreated)
		subscribe('contacts:circles:member:changed', this.onMemberChanged)
		subscribe('contacts:circles:member:deleted', this.onMemberChanged)
		this.measureCircleHeader()
	},

	beforeUnmount() {
		this.resizeObserver?.disconnect()
	},

	methods: {
		/**
		 * Measure the circle details header height from the DOM
		 * and keep it updated via ResizeObserver.
		 */
		measureCircleHeader() {
			const header = document.querySelector('.circle-details__header-wrapper')
			if (!header) {
				return
			}
			this.circleHeaderHeight = header.getBoundingClientRect().height
			this.resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					this.circleHeaderHeight = entry.contentRect.height
				}
			})
			this.resizeObserver.observe(header)
		},

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
				const results = await getSuggestions(term, this.circle)
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

			selection = selection.map((entry) => ({
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

		async onGuestCreated(guest) {
			const results = await getSuggestions(guest.username, this.circle)
			this.$refs.entityPicker.onClick(results[0])
		},

		async fetchCircleMembers(silent = false) {
			if (!this.circle?.canManageMembers) {
				return
			}

			if (!silent) {
				this.loadingList = true
			}
			const payload = { circleId: this.circle.id, search: this.searchQuery || null, role: this.searchRole?.id, limit: this.loadAllMembers ? 0 : undefined }
			this.logger.debug('Fetching members for', payload)

			try {
				await this.$store.dispatch('getCircleMembers', payload)
				console.log('debug: getCircleMembers', this.list)
			} catch (error) {
				console.error(error)
				showError(t('contacts', 'There was an error fetching the member list'))
			} finally {
				if (!silent) {
					this.loadingList = false
				}
			}
		},

		onLoadAllMembers() {
			this.loadAllMembers = true
			this.fetchCircleMembers()
		},

		onMemberChanged() {
			this.fetchCircleMembers(true)
		},
	},
})
</script>

<style lang="scss" scoped>
.member-list {
	max-width: 900px;

	:deep(.empty-content) {
		margin: auto;
	}
}

.empty-content {
	height: 100%;
}

.member-list__virtual {
	overflow: auto;
}

.member-list__too-large {
	margin-top: calc(var(--default-grid-baseline) * 2);
}

.member-list__filters {
	display: flex;
	align-items: flex-end;
	gap: calc(var(--default-grid-baseline) * 2);
	margin-bottom: calc(var(--default-grid-baseline) * 4);

	&--mobile {
		flex-direction: column;
		align-items: stretch;
	}
}

.member-list__search {
	flex: 1;
}
</style>
