<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppContent :aria-label="t('contacts', 'Teams')">
		<EmptyContent v-if="!circle && !userGroup" :name="t('contacts', 'Please select a team')">
			<template #icon>
				<AccountGroup :size="20" />
			</template>
		</EmptyContent>

		<EmptyContent v-else-if="loading" class="empty-content" :name="t('contacts', 'Loading team…')">
			<template #icon>
				<IconLoading :size="20" />
			</template>
		</EmptyContent>

		<UserGroupDetails v-else-if="userGroup" :user-group="userGroup" />
		<CircleDetails v-else :circle="circle" />
	</AppContent>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import {
	NcAppContent as AppContent,
	NcEmptyContent as EmptyContent,
	NcLoadingIcon as IconLoading,
} from '@nextcloud/vue'
import { mapStores } from 'pinia'
import AccountGroup from 'vue-material-design-icons/AccountGroupOutline.vue'
import CircleDetails from '../CircleDetails.vue'
import UserGroupDetails from '../UserGroupDetails.vue'
import IsMobileMixin from '../../mixins/IsMobileMixin.ts'
import RouterMixin from '../../mixins/RouterMixin.js'
import useUserGroupStore from '../../store/userGroup.ts'

export default {
	name: 'CircleContent',

	components: {
		AppContent,
		CircleDetails,
		EmptyContent,
		AccountGroup,
		IconLoading,
		UserGroupDetails,
	},

	mixins: [IsMobileMixin, RouterMixin],

	props: {
		loading: {
			type: Boolean,
			default: true,
		},
	},

	computed: {
		// store variables
		circles() {
			return this.$store.getters.getCircles
		},

		circle() {
			return this.$store.getters.getCircle(this.selectedCircle)
		},

		userGroup() {
			return this.userGroupStore.getUserGroup(this.selectedUserGroup)
		},

		members() {
			return Object.values(this.circle?.members || [])
		},

		...mapStores(useUserGroupStore),
	},

	watch: {
		userGroup(newUserGroup) {
			if (newUserGroup?.id) {
				this.fetchUserGroupMembers(newUserGroup.id)
			}
		},
	},

	beforeMount() {
		if (this.userGroup?.id) {
			this.fetchUserGroupMembers(this.userGroup.id)
		}
	},

	methods: {
		async fetchUserGroupMembers(userGroupId) {
			try {
				await this.userGroupStore.getUserGroupMembers(userGroupId)
			} catch (error) {
				console.error(error)
				showError(t('contacts', 'There was an error fetching the member list'))
			}
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
		margin-inline-end: 10px;
	}
}

.empty-content {
	height: 100%;
}
</style>
