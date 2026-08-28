<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import type Member from '../../models/member.ts'

import MemberListItem from './MemberListItem.vue'

defineProps<{
	label: string
	type: number
	members: Member[]
}>()
</script>

<template>
	<div class="member-list-group">
		<h4
			:id="`member-list-group-${type}`"
			class="member-list-group__heading">
			{{ label }}
		</h4>
		<ul :aria-labelledby="`member-list-group-${type}`" class="member-list-group__list">
			<MemberListItem
				v-for="member in members"
				:key="member.singleId"
				:source="member" />
		</ul>
	</div>
</template>

<style scoped lang="scss">
.member-list-group {
	&__heading {
		display: flex;
		overflow: hidden;
		flex-shrink: 0;
		padding-top: 22px;
		padding-inline-start: 8px;
		margin-bottom: 0;
		user-select: none;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 1.1rem;
		color: var(--color-primary-element);
	}

	&__list {
		-webkit-columns: 2;
		-moz-columns: 2;
		columns: 2;
	}
}

@media screen and (max-width: 700px) {
	.member-list-group__list {
		-webkit-columns: 1;
		-moz-columns: 1;
		columns: 1;
	}
}
</style>
