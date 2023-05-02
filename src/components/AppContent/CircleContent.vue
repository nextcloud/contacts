<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
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
	<AppContent v-if="!circle">
		<EmptyContent :title="t('contacts', 'Please select a circle')">
			<template #icon>
				<IconCircles :size="20" />
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else-if="loading">
		<EmptyContent :title="t('contacts', 'Loading circle …')">
			<template #icon>
				<IconLoading :size="20" />
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else :show-details.sync="showDetails">
		<!-- member list -->
		<template #list>
			<MemberList :list="members"
				:loading="loadingList"
				:show-details.sync="showDetails" />
		</template>

		<!-- main contacts details -->
		<CircleDetails :circle="circle">
			<!-- not a member -->
			<template v-if="!circle.isMember">
				<!-- Pending request validation -->
				<EmptyContent v-if="circle.isPendingMember" :title="t('contacts', 'Your request to join this circle is pending approval')">
					<template #icon>
						<IconLoading :size="20" />
					</template>
				</EmptyContent>

				<EmptyContent v-else :title="t('contacts', 'You are not a member of {circle}', { circle: circle.displayName})">
					<template #icon>
						<IconCircles :size="20" />
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
import IconCircles from '../Icons/IconCircles.vue'
import CircleDetails from '../CircleDetails.vue'
import MemberList from '../MemberList.vue'
import RouterMixin from '../../mixins/RouterMixin.js'

export default {
	name: 'CircleContent',

	components: {
		AppContent,
		CircleDetails,
		EmptyContent,
		MemberList,
		IconCircles,
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
</style>
