<!--
   - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
   - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="usergroup-member__container">
		<NcAvatar :user="member" :size="32" />
		<div class="usergroup-member__info">
			<div v-if="!loading" class="usergroup-member__name">
				{{ displayName }}
			</div>
			<div class="usergroup-member__role">
				{{ t('contacts', 'Member') }}
			</div>
		</div>
	</div>
</template>

<script>
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { NcAvatar } from '@nextcloud/vue'

export default {
	name: 'UserGroupMember',

	components: {
		NcAvatar,
	},

	props: {
		member: {
			type: String,
			required: true,
		},
	},

	data() {
		return {
			loading: true,
			displayName: '',
		}
	},

	mounted() {
		this.fetchMemberInfo()
	},

	methods: {
		async fetchMemberInfo() {
			const user = encodeURIComponent(this.member)
			const { data } = await axios.post(generateUrl('contactsmenu/findOne'), `shareType=0&shareWith=${user}`)
			this.displayName = data.fullName
			this.loading = false
		},
	},
}
</script>

<style lang="scss" scoped>
.usergroup-member {
	&__container {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px;
		border-radius: var(--border-radius);
		background-color: var(--color-background-soft);
	}

	&__info {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	&__name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&__role {
		font-size: 0.75rem;
		color: var(--color-text-maxcontrast);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
</style>
