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
	<AppNavigationItem :key="circle.key"
		:title="circle.displayName"
		:to="circle.router">
		<template #icon>
			<IconCircles :size="20" />
		</template>
		<template v-if="loadingAction" slot="actions">
			<ActionText>
				<template #icon>
					<IconLoading :size="20" />
				</template>
				{{ t('contacts', 'Loading …') }}
			</ActionText>
		</template>

		<template v-else slot="actions">
			<ActionButton v-if="circle.canManageMembers"
				:close-after-click="true"
				@click="addMemberToCircle">
				<template #icon>
					<IconAdd :size="20" />
				</template>
				{{ t('contacts', 'Add member') }}
			</ActionButton>

			<!-- copy circle link -->
			<ActionLink :href="circleUrl"
				:icon="copyLinkIcon"
				@click.stop.prevent="copyToClipboard(circleUrl)">
				{{ copyButtonText }}
			</ActionLink>

			<!-- leave circle -->
			<ActionButton v-if="circle.canLeave"
				@click="confirmLeaveCircle">
				{{ t('contacts', 'Leave circle') }}
				<ExitToApp slot="icon"
					:size="16"
					decorative />
			</ActionButton>

			<!-- join circle -->
			<ActionButton v-else-if="!circle.isMember && circle.canJoin"
				:disabled="loadingJoin"
				@click="joinCircle">
				{{ joinButtonTitle }}
				<LocationEnter slot="icon"
					:size="16"
					decorative />
			</ActionButton>

			<!-- delete circle -->
			<ActionButton v-if="circle.canDelete"
				@click="confirmDeleteCircle">
				<template #icon>
					<IconDelete :size="20" />
				</template>
				{{ t('contacts', 'Delete circle') }}
			</ActionButton>
		</template>

		<template #counter>
			<NcCounterBubble v-if="memberCount > 0">
				{{ memberCount }}
			</NcCounterBubble>
		</template>
	</AppNavigationItem>
</template>

<script>
import {
	NcActionButton as ActionButton,
	NcActionLink as ActionLink,
	NcActionText as ActionText,
	NcCounterBubble,
	NcAppNavigationItem as AppNavigationItem,
	NcLoadingIcon as IconLoading,
} from '@nextcloud/vue'
import ExitToApp from 'vue-material-design-icons/ExitToApp.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import IconDelete from 'vue-material-design-icons/Delete.vue'
import LocationEnter from 'vue-material-design-icons/LocationEnter.vue'
import IconCircles from '../Icons/IconCircles.vue'
import Circle from '../../models/circle.ts'
import CircleActionsMixin from '../../mixins/CircleActionsMixin.js'

export default {
	name: 'CircleNavigationItem',

	components: {
		ActionButton,
		ActionLink,
		ActionText,
		NcCounterBubble,
		AppNavigationItem,
		ExitToApp,
		IconAdd,
		IconDelete,
		LocationEnter,
		IconCircles,
		IconLoading,
	},

	mixins: [CircleActionsMixin],

	props: {
		circle: {
			type: Circle,
			required: true,
		},
	},

	computed: {
		memberCount() {
			const count = Object.keys(this.circle?.members || []).length

			// If member list is empty, let's try the population initial count
			if (count === 0 && this.circle.population > 0) {
				return this.circle.population
			}

			return count
		},
	},
}
</script>
