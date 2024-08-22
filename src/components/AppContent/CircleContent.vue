<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppContent v-if="!circle">
		<EmptyContent :name="t('contacts', 'Please select a team')">
			<template #icon>
				<AccountGroup :size="20" />
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else-if="loading">
		<EmptyContent class="empty-content" :name="t('contacts', 'Loading team…')">
			<template #icon>
				<IconLoading :size="20" />
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else :show-details.sync="showDetails">
		<!-- main contacts details -->
		<CircleDetails :circle="circle">
			<!-- not a member -->
			<template v-if="!circle.isMember">
				<!-- Pending request validation -->
				<EmptyContent v-if="circle.isPendingMember" :name="t('contacts', 'Your request to join this team is pending approval')">
					<template #icon>
						<IconLoading :size="20" />
					</template>
				</EmptyContent>

				<EmptyContent v-else :name="t('contacts', 'You are not a member of {circle}', { circle: circle.displayName})">
					<template #icon>
						<AccountGroup :size="20" />
					</template>
				</EmptyContent>
			</template>
		</CircleDetails>
	</AppContent>
</template>
<script>
import { showError } from '@nextcloud/dialogs'
import {
	NcAppContent as AppContent,
	NcEmptyContent as EmptyContent,
	NcLoadingIcon as IconLoading,
	isMobile,
} from '@nextcloud/vue'
import AccountGroup from 'vue-material-design-icons/AccountGroup.vue'
import CircleDetails from '../CircleDetails.vue'
import RouterMixin from '../../mixins/RouterMixin.js'

export default {
	name: 'CircleContent',

	components: {
		AppContent,
		CircleDetails,
		EmptyContent,
		AccountGroup,
		IconLoading,
	},

	mixins: [isMobile, RouterMixin],

	props: {
		loading: {
			type: Boolean,
			default: true,
		},
	},

	data() {
		return {
			loadingList: false,
			showDetails: false,
		}
	},

	computed: {
		// store variables
		circles() {
			return this.$store.getters.getCircles
		},
		circle() {
			return this.$store.getters.getCircle(this.selectedCircle)
		},
		members() {
			return Object.values(this.circle?.members || [])
		},

		/**
		 * Is the current circle empty
		 *
		 * @return {boolean}
		 */
		isEmptyCircle() {
			return this.members.length === 0
		},
	},

	watch: {
		circle(newCircle) {
			if (newCircle?.id) {
				this.fetchCircleMembers(newCircle.id)
			}
		},
	},

	beforeMount() {
		if (this.circle?.id) {
			this.fetchCircleMembers(this.circle.id)
		}
	},

	methods: {
		async fetchCircleMembers(circleId) {
			this.loadingList = true
			this.logger.debug('Fetching members for', { circleId })

			try {
				await this.$store.dispatch('getCircleMembers', circleId)
			} catch (error) {
				console.error(error)
				showError(t('contacts', 'There was an error fetching the member list'))
			} finally {
				this.loadingList = false
			}
		},

		// Hide the circle details
		hideDetails() {
			this.showDetails = false
		},
	},
}
</script>

<style lang="scss" scoped>
// TODO: replace my button component when available
button {
	height: 44px;
	display: flex;
	justify-content: center;
	align-items: center;
	span {
		margin-right: 10px;
	}
}

.empty-content {
	height: 100%;
}
</style>
