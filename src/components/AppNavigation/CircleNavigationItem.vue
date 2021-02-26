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
				:href="circle.url"
				:icon="copyLoading ? 'icon-loading-small' : 'icon-public'"
				@click.stop.prevent="copyToClipboard(circleUrl)">
				{{ copyButtonText }}
			</ActionLink>

			<!-- leave circle -->
			<ActionButton
				v-if="circle.isMember"
				@click="leaveCircle">
				{{ t('contacts', 'Leave circle') }}
				<ExitToApp slot="icon"
					:size="16"
					decorative />
			</ActionButton>

			<!-- join circle -->
			<ActionButton
				v-else-if="circle.canJoin"
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

		<AppNavigationCounter v-if="circle.members.length > 0" slot="counter">
			{{ circle.members.length }}
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

import CopyToClipboardMixin from '../../mixins/CopyToClipboardMixin'
import { deleteCircle, joinCircle } from '../../services/circles'
import { showError } from '@nextcloud/dialogs'

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
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			loading: false
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
			return window.location.origin + this.circle.url
		},

		joinButtonTitle() {
			if (this.circle.requireJoinAccept) {
				return t('contacts', 'Request to join')
			}
			return t('contacts', 'Join circle')
		},
	},

	methods: {
		// Trigger the entity picker view
		addMemberToCircle() {
			emit('contacts:circles:append', this.circle.id)
		},

		async joinCircle() {
			try {
				await joinCircle(this.circle.id)
			} catch (error) {
				showError(t('contacts', 'Unable to join the circle'))
			}

		},

		leaveCircle() {

		},

		async deleteCircle() {
			this.loading = true

			try {
				await deleteCircle(this.circle.id)
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
