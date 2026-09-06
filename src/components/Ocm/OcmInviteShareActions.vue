<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="share-rows">
		<div class="share-row">
			<span class="share-row__label">{{ t('contacts', 'Invite link') }}</span>
			<span class="share-row__value" :title="inviteLink">{{ inviteLink }}</span>
			<NcButton
				variant="tertiary-no-background"
				:aria-label="t('contacts', 'Copy invite link to clipboard')"
				:title="t('contacts', 'Copy invite link to clipboard')"
				data-testid="ocm-invite-link-copy-btn"
				@click="emitCopy(inviteLink, clipboardKinds.inviteLink)">
				<template #icon>
					<ContentCopyIcon :size="20" />
				</template>
			</NcButton>
		</div>

		<div class="share-row">
			<span class="share-row__label">{{ t('contacts', 'Invite code') }}</span>
			<span class="share-row__value" :title="inviteCode">{{ inviteCode }}</span>
			<NcButton
				variant="tertiary-no-background"
				:aria-label="t('contacts', 'Copy invite code to clipboard')"
				:title="t('contacts', 'Copy invite code to clipboard')"
				data-testid="ocm-invite-code-copy-btn"
				@click="emitCopy(inviteCode, clipboardKinds.inviteCode)">
				<template #icon>
					<ContentCopyIcon :size="20" />
				</template>
			</NcButton>
		</div>

		<div v-if="encodedCopyButtonEnabled" class="share-row">
			<span class="share-row__label">{{ t('contacts', 'Encoded invite') }}</span>
			<span class="share-row__value" :title="encodedInvite">{{ encodedInvite }}</span>
			<NcButton
				variant="tertiary-no-background"
				:aria-label="t('contacts', 'Copy encoded invite to clipboard')"
				:title="t('contacts', 'Copy encoded invite to clipboard')"
				data-testid="ocm-invite-base64-copy-btn"
				@click="emitCopy(encodedInvite, clipboardKinds.encodedInvite)">
				<template #icon>
					<ContentCopyIcon :size="20" />
				</template>
			</NcButton>
		</div>
	</div>
</template>

<script>
import { NcButton } from '@nextcloud/vue'
import ContentCopyIcon from 'vue-material-design-icons/ContentCopy.vue'

export default {
	name: 'OcmInviteShareActions',
	components: {
		ContentCopyIcon,
		NcButton,
	},

	props: {
		encodedCopyButtonEnabled: {
			type: Boolean,
			default: false,
		},

		inviteLink: {
			type: String,
			required: true,
		},

		inviteCode: {
			type: String,
			default: '',
		},

		encodedInvite: {
			type: String,
			default: '',
		},

		clipboardKinds: {
			type: Object,
			required: true,
		},
	},

	emits: ['copy'],

	methods: {
		emitCopy(text, kind) {
			this.$emit('copy', { text, kind })
		},
	},
}
</script>

<style lang="scss" scoped>
.share-rows {
	display: flex;
	flex-direction: column;
}

.share-row {
	display: flex;
	align-items: center;
	gap: calc(var(--default-grid-baseline) * 2);
	padding: calc(var(--default-grid-baseline) * 2) 0;
	border-bottom: 1px solid var(--color-border);

	&:last-child {
		border-bottom: none;
	}

	&__label {
		flex: 0 0 calc(var(--default-grid-baseline) * 28);
		color: var(--color-text-maxcontrast);
		font-size: 0.9em;
	}

	&__value {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
		font-size: 0.85em;
		color: var(--color-main-text);
	}
}
</style>
