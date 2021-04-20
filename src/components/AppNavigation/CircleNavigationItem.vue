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
	<AppNavigationItem
		:key="circle.key"
		:to="circle.router"
		:title="circle.displayName"
		:icon="circle.icon">
		<template v-if="loading" slot="actions">
			<ActionText icon="icon-loading-small">
				{{ t('contacts', 'Loading …') }}
			</ActionText>
		</template>

		<template v-else slot="actions">
			<ActionButton
				v-if="circle.canManageMembers"
				icon="icon-add"
				@click="addMemberToCircle">
				{{ t('contacts', 'Add member') }}
			</ActionButton>

			<!-- copy circle link -->
			<ActionLink
				:href="circleUrl"
				:icon="copyLoading ? 'icon-loading-small' : 'icon-public'"
				@click.stop.prevent="copyToClipboard(circleUrl)">
				{{ copyButtonText }}
			</ActionLink>

			<!-- leave circle -->
			<ActionButton
				v-if="circle.canLeave"
				@click="leaveCircle">
				{{ t('contacts', 'Leave circle') }}
				<ExitToApp slot="icon"
					:size="16"
					decorative />
			</ActionButton>

			<!-- join circle -->
			<ActionButton
				v-else-if="!circle.isMember && circle.canJoin"
				@click="joinCircle">
				{{ joinButtonTitle }}
				<LocationEnter slot="icon"
					:size="16"
					decorative />
			</ActionButton>

			<!-- delete circle -->
			<ActionButton
				v-if="circle.canDelete"
				icon="icon-delete"
				@click="deleteCircle">
				{{ t('contacts', 'Delete') }}
			</ActionButton>
		</template>

		<AppNavigationCounter v-if="memberCount > 0" slot="counter">
			{{ memberCount }}
		</AppNavigationCounter>
	</AppNavigationItem>
</template>

<script>
import { emit } from '@nextcloud/event-bus'

import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import ActionLink from '@nextcloud/vue/dist/Components/ActionLink'
import ActionText from '@nextcloud/vue/dist/Components/ActionText'
import AppNavigationCounter from '@nextcloud/vue/dist/Components/AppNavigationCounter'
import AppNavigationItem from '@nextcloud/vue/dist/Components/AppNavigationItem'
import ExitToApp from 'vue-material-design-icons/ExitToApp'
import LocationEnter from 'vue-material-design-icons/LocationEnter'

import { joinCircle } from '../../services/circles.ts'
import { showError } from '@nextcloud/dialogs'
import Circle from '../../models/circle.ts'
import CopyToClipboardMixin from '../../mixins/CopyToClipboardMixin'

export default {
	name: 'CircleNavigationItem',

	components: {
		ActionButton,
		ActionLink,
		ActionText,
		AppNavigationCounter,
		AppNavigationItem,
		ExitToApp,
		LocationEnter,
	},

	mixins: [CopyToClipboardMixin],

	props: {
		circle: {
			type: Circle,
			required: true,
		},
	},

	data() {
		return {
			loading: false,
		}
	},

	computed: {
		copyButtonText() {
			if (this.copied) {
				return this.copySuccess
					? t('contacts', 'Copied')
					: t('contacts', 'Could not copy')
			}
			return t('contacts', 'Copy link')
		},

		circleUrl() {
			const route = this.$router.resolve(this.circle.router)
			return window.location.origin + route.href
		},

		joinButtonTitle() {
			if (this.circle.requireJoinAccept) {
				return t('contacts', 'Request to join')
			}
			return t('contacts', 'Join circle')
		},

		memberCount() {
			return Object.values(this.circle?.members || []).length
		},
	},

	methods: {
		// Trigger the entity picker view
		async addMemberToCircle() {
			await this.$router.push(this.circle.router)
			emit('contacts:circles:append', this.circle.id)
		},

		async joinCircle() {
			this.loading = true
			try {
				await joinCircle(this.circle.id)
			} catch (error) {
				showError(t('contacts', 'Unable to join the circle'))
			} finally {
				this.loading = false
			}

		},

		async leaveCircle() {
			this.loading = true
			const member = this.circle.initiator

			try {
				await this.$store.dispatch('deleteMemberFromCircle', {
					member,
					leave: true,
				})
			} catch (error) {
				console.error('Could not leave the circle', member, error)
				showError(t('contacts', 'Could not leave the circle {displayName}', this.circle))
			} finally {
				this.loading = false
			}

		},

		async deleteCircle() {
			this.loading = true

			try {
				this.$store.dispatch('deleteCircle', this.circle.id)
			} catch (error) {
				showError(t('contacts', 'Unable to delete the circle'))
			} finally {
				this.loading = false
			}
		},
	},
}
</script>
