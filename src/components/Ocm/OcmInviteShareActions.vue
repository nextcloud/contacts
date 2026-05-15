<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="share-buttons">
		<NcButton variant="secondary" data-testid="ocm-invite-link-copy-btn" @click="emitCopy(wayfLink, clipboardKinds.inviteLink)">
			<template #icon>
				<ContentCopyIcon :size="20" />
			</template>
			{{ t('contacts', 'Copy invite link') }}
		</NcButton>
		<NcButton variant="secondary" data-testid="ocm-invite-token-copy-btn" @click="emitCopy(plainInviteString, clipboardKinds.inviteCode)">
			<template #icon>
				<ContentCopyIcon :size="20" />
			</template>
			{{ t('contacts', 'Copy invite code') }}
		</NcButton>
		<NcButton
			v-if="encodedCopyButtonEnabled"
			variant="secondary"
			data-testid="ocm-invite-base64-copy-btn"
			@click="emitCopy(base64InviteString, clipboardKinds.encodedInvite)">
			<template #icon>
				<ContentCopyIcon :size="20" />
			</template>
			{{ t('contacts', 'Copy encoded invite code') }}
		</NcButton>
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

		wayfLink: {
			type: String,
			required: true,
		},

		plainInviteString: {
			type: String,
			required: true,
		},

		base64InviteString: {
			type: String,
			required: true,
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
.share-buttons {
	display: flex;
	flex-direction: column;
	gap: 0.5em;

	:deep(.button-vue) {
		width: 100%;
		justify-content: flex-start;
	}
}
</style>
