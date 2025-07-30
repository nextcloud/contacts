<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="member-grid-item">
		<NcAvatar v-if="isTeam"
			:display-name="member.displayName"
			:is-no-user="true"
			:size="32">
			<template #icon>
				<IconAccountGroup :size="20" />
			</template>
		</NcAvatar>
		<NcAvatar v-else
			:user="member.userId"
			:display-name="member.displayName"
			:size="32" />
		<span class="member-name">{{ member.displayName }}</span>
	</div>
</template>

<script>
import { NcAvatar } from '@nextcloud/vue'
import IconAccountGroup from 'vue-material-design-icons/AccountGroup.vue'

export default {
	name: 'MemberGridItem',
	components: {
		NcAvatar,
		IconAccountGroup,
	},
	props: {
		member: {
			type: Object,
			required: true,
		},
		isTeam: {
			type: Boolean,
			default: false,
		},
	},
}
</script>

<style lang="scss" scoped>
.member-grid-item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	border-radius: var(--border-radius);
	background-color: var(--color-background-soft);

	.member-name {
		flex-grow: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

}
</style>
