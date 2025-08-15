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
		<div class="member-info">
			<span class="member-name">{{ member.displayName }}</span>
			<span v-if="memberRole" class="member-role">{{ memberRole }}</span>
		</div>
	</div>
</template>

<script>
import { NcAvatar } from '@nextcloud/vue'
import IconAccountGroup from 'vue-material-design-icons/AccountGroupOutline.vue'
import { CIRCLES_MEMBER_LEVELS, MemberLevels } from '../../models/constants'

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
	computed: {
		memberRole() {
			if (!this.member.level || this.member.level === MemberLevels.NONE) {
				return null
			}
			return CIRCLES_MEMBER_LEVELS[this.member.level] || null
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

	.member-info {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.member-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.member-role {
		font-size: 0.75rem;
		color: var(--color-text-maxcontrast);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
</style>
