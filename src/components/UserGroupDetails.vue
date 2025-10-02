<!--
   - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
   - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="usergroup-details-container">
		<div class="usergroup-details-grid">
			<div class="usergroup-details__header-wrapper">
				<div class="usergroup-details-grid__avatar">
					<NcAvatar
						:disable-tooltip="true"
						:display-name="userGroup.displayName"
						:is-no-user="true"
						:size="75" />
				</div>
				<div class="usergroup-details__header">
					<div class="usergroup-name-wrapper">
						<h2 class="usergroup-name">
							<span :title="userGroup.displayName">{{ userGroup.displayName }}</span>
						</h2>
						<div class="usergroup-details__subtitle">
							{{ t('contacts', 'This is a read-only group managed by administrators. Group members can only view this group.') }}
						</div>
					</div>
					<div class="actions">
						<NcButton variant="secondary" @click.stop.prevent="copyToClipboard(userGroupUrl)">
							<template #icon>
								<CopyIcon :size="20" />
							</template>
							{{ t('contacts', 'Copy link') }}
						</NcButton>
					</div>
				</div>
			</div>
			<div class="usergroup-details__main-content">
				<h3 class="usergroup-details__content-heading">
					{{ t('contacts', 'Members') }}
				</h3>
				<div class="usergroup-details__member-grid">
					<UserGroupMember
						v-for="member in userGroup.members"
						:key="`user-group-member-${member}`"
						:member="member" />
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { NcAvatar, NcButton } from '@nextcloud/vue'
import CopyIcon from 'vue-material-design-icons/ContentCopy.vue'
import UserGroupMember from './UserGroupDetails/UserGroupMember.vue'
import CopyToClipboardMixin from '../mixins/CopyToClipboardMixin.js'
import UserGroup from '../models/userGroup.ts'

export default {
	name: 'UserGroupDetails',

	components: {
		CopyIcon,
		NcAvatar,
		NcButton,
		UserGroupMember,
	},

	mixins: [CopyToClipboardMixin],

	props: {
		userGroup: {
			type: UserGroup,
			required: true,
		},
	},

	computed: {
		userGroupUrl() {
			return window.location.href
		},
	},
}
</script>

<style lang="scss" scoped>
.usergroup-details {
	&-container {
		padding-inline: 20px;
		margin-top: 1rem;
	}

	&-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 36px;
		max-width: 800px;
		margin-inline: auto;

		.usergroup-name-wrapper {
			width: 100%;
		}
	}

	&__header-wrapper {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 24px;
	}

	&__header {
		background-color: transparent;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		width: 100%;

		.usergroup-name {
			font-size: 1.5rem;
			font-weight: bold;
			margin: 0px;
			margin-bottom: 2px;
		}
	}

	&__subtitle {
		color: var(--color-text-maxcontrast);
		margin-bottom: 8px;
	}

	&__main-content {
		margin-inline-start: 99px;

		@media (max-width: 768px) {
			margin-inline-start: 0px;
		}
	}

	&__content-heading {
		font-weight: bold;
		font-size: 1.2rem;
		line-height: 0px;
		margin-top: 4px;
		margin-bottom: 8px;
	}

	&__member-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
		max-width: 500px;

		@media (max-width: 768px) {
			grid-template-columns: 1fr;
		}

		@media (min-width: 1200px) {
			grid-template-columns: repeat(3, 1fr);
		}
	}

}
</style>
