<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<AppNavigationItem :key="circle.key"
		:name="circle.displayName"
		:to="circle.router">
		<template #icon>
			<AccountStar v-if="circle.isOwner" :size="20" />
			<AccountGroup v-else-if="circle.isMember" :size="20" />
			<AccountGroupOutline v-else :size="20" />
		</template>
		<template #actions>
			<ActionText v-if="loadingAction">
				<template #icon>
					<IconLoading :size="20" />
				</template>
				{{ t('contacts', 'Loading …') }}
			</ActionText>
			<template v-else>
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
					{{ t('contacts', 'Leave team') }}
					<template #icon>
						<ExitToApp :size="16" />
					</template>
				</ActionButton>

				<!-- join circle -->
				<ActionButton v-else-if="!circle.isMember && circle.canJoin"
					:disabled="loadingJoin"
					@click="joinCircle">
					{{ joinButtonTitle }}
					<template  #icon>
						<LocationEnter :size="16" />
					</template>
				</ActionButton>

				<!-- delete circle -->
				<ActionButton v-if="circle.canDelete"
					@click="confirmDeleteCircle">
					<template #icon>
						<IconDelete :size="20" />
					</template>
					{{ t('contacts', 'Delete team') }}
				</ActionButton>
			</template>
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
import AccountStar from 'vue-material-design-icons/AccountStar.vue'
import AccountGroup from 'vue-material-design-icons/AccountGroup.vue'
import AccountGroupOutline from 'vue-material-design-icons/AccountGroupOutline.vue'

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
		AccountStar,
		AccountGroup,
		AccountGroupOutline,
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
