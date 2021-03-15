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
	<AppContent>
		<div v-if="!circle">
			<EmptyContent icon="icon-circles">
				{{ t('contacts', 'Please select a circle') }}
			</EmptyContent>
		</div>

		<div v-else id="app-content-wrapper">
			<!-- loading members -->
			<AppContentDetails v-if="loading">
				<EmptyContent icon="icon-loading">
					{{ t('contacts', 'Loading circle members…') }}
				</EmptyContent>
			</AppContentDetails>

			<!-- not a member -->
			<AppContentDetails v-else-if="!circle.isMember">
				<EmptyContent v-if="!loadingJoin" icon="icon-circles">
					{{ t('contacts', 'You are not a member of this circle') }}

					<!-- Only show the join button if the circle is accepting requests -->
					<template v-if="circle.canJoin" #desc>
						<button :disabled="loadingJoin" class="primary" @click="requestJoin">
							{{ t('contacts', 'Request to join') }}
						</button>
					</template>
				</EmptyContent>

				<EmptyContent v-else-if="circle.isPendingJoin" icon="icon-loading">
					{{ t('contacts', 'Your request to join this circle is pending approval') }}
				</EmptyContent>

				<EmptyContent v-else icon="icon-loading">
					{{ t('contacts', 'Joining circle') }}
				</EmptyContent>
			</AppContentDetails>

			<template v-else>
				<!-- member list -->
				<MemberList :list="members" />

				<!-- main contacts details -->
				<CircleDetails :circle-id="selectedCircle" />
			</template>
		</div>
	</AppContent>
</template>
<script>
import AppContentDetails from '@nextcloud/vue/dist/Components/AppContentDetails'
import AppContent from '@nextcloud/vue/dist/Components/AppContent'
import EmptyContent from '@nextcloud/vue/dist/Components/EmptyContent'

import CircleDetails from '../CircleDetails'
import MemberList from '../MemberList'
import RouterMixin from '../../mixins/RouterMixin'
import { joinCircle } from '../../services/circles.ts'
import { showError } from '@nextcloud/dialogs'

export default {
	name: 'CircleContent',

	components: {
		AppContent,
		AppContentDetails,
		CircleDetails,
		EmptyContent,
		MemberList,
	},

	mixins: [RouterMixin],

	props: {
		loading: {
			type: Boolean,
			default: true,
		},
	},

	data() {
		return {
			loadingJoin: false,
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
		 * @returns {boolean}
		 */
		isEmptyCircle() {
			return this.members.length === 0
		},
	},

	watch: {
		circle(newCircle) {
			if (newCircle?.id) {
				console.debug('Circles list is done loading, fetching members for', newCircle.id)
				this.fetchCircleMembers(newCircle.id)
			}
		},
	},

	methods: {
		fetchCircleMembers(circleId) {
			this.$store.dispatch('getCircleMembers', circleId)
		},

		/**
		 * Request to join this circle
		 */
		async requestJoin() {
			this.loadingJoin = true

			try {
				await joinCircle(this.circle.id)
			} catch (error) {
				showError(t('contacts', 'Unable to join the circle'))
			} finally {
				this.loadingJoin = false
			}

		},
	},
}
</script>

<style lang="scss" scoped>
#app-content-wrapper {
	display: flex;
}
</style>
