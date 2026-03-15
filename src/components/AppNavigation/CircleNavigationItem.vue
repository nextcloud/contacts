<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<AppNavigationItem
		:key="circle.key"
		:name="circle.displayName"
		:to="circle.router">
		<template #icon>
			<AccountStar v-if="circle.isOwner" :size="20" />
			<AccountGroupOutline v-else :size="20" />
		</template>
		<template #actions>
			<ActionText v-if="loadingAction">
				<template #icon>
					<IconLoading :size="20" />
				</template>
				{{ t('contacts', 'Loading …') }}
			</ActionText>
			<template v-else>
				<ActionButton
					v-if="circle.canManageMembers"
					:close-after-click="true"
					@click="addMemberToCircle">
					<template #icon>
						<AccountPlusIcon :size="20" />
					</template>
					{{ t('contacts', 'Add members') }}
				</ActionButton>

				<ActionButton
					v-if="canManageTeam"
					:close-after-click="true"
					@click="showSettings = true">
					<template #icon>
						<IconCog :size="20" />
					</template>
					{{ t('contacts', 'Manage settings') }}
				</ActionButton>

				<!-- copy circle link -->
				<ActionLink
					:href="circleUrl"
					:icon="copyLinkIcon"
					@click.stop.prevent="copyToClipboard(circleUrl)">
					{{ copyButtonText }}
				</ActionLink>

				<!-- leave circle -->
				<ActionButton
					v-if="circle.canLeave"
					@click="confirmLeaveCircle">
					{{ t('contacts', 'Leave team') }}
					<template #icon>
						<ExitToApp :size="16" />
					</template>
				</ActionButton>

				<!-- join circle -->
				<ActionButton
					v-else-if="!circle.isMember && circle.canJoin"
					:disabled="loadingJoin"
					@click="joinCircle">
					{{ joinButtonTitle }}
					<template #icon>
						<LocationEnter :size="16" />
					</template>
				</ActionButton>

				<!-- delete circle -->
				<ActionButton
					v-if="circle.canDelete"
					@click="confirmDeleteCircle">
					<template #icon>
						<IconDelete :size="20" />
					</template>
					{{ t('contacts', 'Delete team') }}
				</ActionButton>
			</template>
		</template>

		<template #counter>
			<NcCounterBubble
				v-if="memberCount > 0"
				:count="memberCount" />
		</template>
	</AppNavigationItem>
	<CircleSettings v-model:open="showSettings" :circle="circle" />
</template>

<script>
import {
	NcActionButton as ActionButton,
	NcActionLink as ActionLink,
	NcActionText as ActionText,
	NcAppNavigationItem as AppNavigationItem,
	NcLoadingIcon as IconLoading,
	NcCounterBubble,
} from '@nextcloud/vue'
import AccountGroupOutline from 'vue-material-design-icons/AccountGroupOutline.vue'
import AccountPlusIcon from 'vue-material-design-icons/AccountPlusOutline.vue'
import AccountStar from 'vue-material-design-icons/AccountStarOutline.vue'
import IconCog from 'vue-material-design-icons/CogOutline.vue'
import ExitToApp from 'vue-material-design-icons/ExitToApp.vue'
import LocationEnter from 'vue-material-design-icons/LocationEnter.vue'
import IconDelete from 'vue-material-design-icons/TrashCanOutline.vue'
import CircleSettings from '../CircleDetails/CircleSettings.vue'
import CircleActionsMixin from '../../mixins/CircleActionsMixin.js'
import Circle from '../../models/circle.ts'
import UserGroup from '../../models/userGroup.ts'

export default {
	name: 'CircleNavigationItem',

	components: {
		ActionButton,
		ActionLink,
		ActionText,
		CircleSettings,
		NcCounterBubble,
		AppNavigationItem,
		ExitToApp,
		IconCog,
		IconDelete,
		LocationEnter,
		AccountStar,
		AccountGroupOutline,
		AccountPlusIcon,
		IconLoading,
	},

	mixins: [CircleActionsMixin],

	props: {
		circle: {
			type: [Circle, UserGroup],
			required: true,
		},
	},

	data() {
		return {
			showSettings: false,
		}
	},

	computed: {
		canManageTeam() {
			return (this.circle.isOwner || this.circle.isAdmin) && !this.circle.isPersonal
		},

		memberCount() {
			return this.circle.populationInherited || 0
		},
	},
}
</script>
