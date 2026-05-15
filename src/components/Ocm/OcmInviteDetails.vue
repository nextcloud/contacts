<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcAppContentDetails>
		<!-- nothing selected or invite not found -->
		<NcEmptyContent
			v-if="!invite"
			class="empty-content"
			:name="t('contacts', 'No invite selected')"
			:description="t('contacts', 'Select an invite on the list to begin')">
			<template #icon>
				<IconAccountSwitchOutline :size="20" />
			</template>
		</NcEmptyContent>

		<template v-else>
			<div class="invite-details">
				<h2>{{ t('contacts', 'OCM invite') }}</h2>

				<div class="invite-info">
					<div v-if="invite.recipientName" class="info-row">
						<span class="info-label">{{ t('contacts', 'Label') }}</span>
						<span class="info-value" data-testid="ocm-invite-detail-label">{{ invite.recipientName }}</span>
					</div>
					<div v-if="invite.recipientEmail" class="info-row">
						<span class="info-label">{{ t('contacts', 'Sent to') }}</span>
						<span class="info-value" data-testid="ocm-invite-detail-email">{{ invite.recipientEmail }}</span>
					</div>
					<div class="info-row">
						<span class="info-label">{{ t('contacts', 'Created') }}</span>
						<span class="info-value">{{ formatDate(invite.createdAt) }}</span>
					</div>
					<div class="info-row">
						<span class="info-label">{{ t('contacts', 'Expires') }}</span>
						<span class="info-value">{{ formatDate(invite.expiredAt) }}</span>
					</div>
				</div>

				<!-- Share buttons -->
				<details
					v-if="invite.recipientEmail"
					:key="inviteKey"
					class="share-section share-section--collapsible"
					data-testid="ocm-invite-share-section">
					<summary class="share-section__summary">
						<span>{{ t('contacts', 'More ways to share') }}</span>
					</summary>
					<p class="share-hint">
						{{ t('contacts', 'Useful for chat apps and manual acceptance. The recipient already received the invite by email.') }}
					</p>
					<OcmInviteShareActions
						:base64-invite-string="base64InviteString"
						:clipboard-kinds="clipboardKinds"
						:encoded-copy-button-enabled="encodedCopyButtonEnabled"
						:plain-invite-string="plainInviteString"
						:wayf-link="wayfLink"
						@copy="onCopyAction" />
				</details>
				<div v-else class="share-section" data-testid="ocm-invite-share-section">
					<h3>{{ t('contacts', 'Share invite') }}</h3>
					<p class="share-hint">
						{{ t('contacts', 'The invite link is the easiest way to share. Invite codes like token@provider are for manual acceptance.') }}
					</p>
					<OcmInviteShareActions
						:base64-invite-string="base64InviteString"
						:clipboard-kinds="clipboardKinds"
						:encoded-copy-button-enabled="encodedCopyButtonEnabled"
						:plain-invite-string="plainInviteString"
						:wayf-link="wayfLink"
						@copy="onCopyAction" />
				</div>

				<!-- Action buttons -->
				<div class="action-buttons">
					<NcButton
						v-if="invite.recipientEmail"
						variant="primary"
						data-testid="ocm-invite-resend-btn"
						@click="onResend">
						<template #icon>
							<EmailFastOutlineIcon :size="20" />
						</template>
						{{ t('contacts', 'Resend email') }}
					</NcButton>
					<NcButton
						v-else
						variant="primary"
						data-testid="ocm-invite-attach-email-btn"
						@click="openAttachEmailForm">
						<template #icon>
							<EmailFastOutlineIcon :size="20" />
						</template>
						{{ t('contacts', 'Send via email') }}
					</NcButton>
					<NcButton
						variant="error"
						data-testid="ocm-invite-revoke-btn"
						@click="onRevoke">
						{{ t('contacts', 'Revoke invite') }}
					</NcButton>
				</div>
			</div>
		</template>

		<Modal
			v-if="showAttachEmailForm"
			v-model:show="showAttachEmailForm"
			:name="t('contacts', 'Send invite via email')"
			:no-close="submittingAttachEmail">
			<OcmAttachEmailForm
				:loading="submittingAttachEmail"
				@submit="onAttachEmailSubmit"
				@cancel="closeAttachEmailForm" />
		</Modal>
	</NcAppContentDetails>
</template>

<script>

import { showError, showSuccess } from '@nextcloud/dialogs'
import { loadState } from '@nextcloud/initial-state'
import moment from '@nextcloud/moment'
import { generateUrl } from '@nextcloud/router'
import {
	NcModal as Modal,
	NcAppContentDetails,
	NcButton,
	NcEmptyContent,
} from '@nextcloud/vue'
import { mapStores } from 'pinia'
import IconAccountSwitchOutline from 'vue-material-design-icons/AccountSwitchOutline.vue'
import EmailFastOutlineIcon from 'vue-material-design-icons/EmailFastOutline.vue'
import OcmAttachEmailForm from './OcmAttachEmailForm.vue'
import OcmInviteShareActions from './OcmInviteShareActions.vue'
import useOcmInvitesStore from '../../store/ocminvites.ts'

const dateFormat = 'lll'

const CLIPBOARD_KIND_INVITE_LINK = 'invite-link'
const CLIPBOARD_KIND_INVITE_CODE = 'invite-code'
const CLIPBOARD_KIND_ENCODED_INVITE = 'encoded-invite'

export default {
	name: 'OcmInviteDetails',

	components: {
		EmailFastOutlineIcon,
		IconAccountSwitchOutline,
		Modal,
		NcAppContentDetails,
		NcButton,
		NcEmptyContent,
		OcmAttachEmailForm,
		OcmInviteShareActions,
	},

	props: {
		inviteKey: {
			type: String,
			default: undefined,
		},
	},

	data() {
		const config = loadState('contacts', 'ocmInvitesConfig', {
			optionalMail: false,
			ccSender: true,
			encodedCopyButton: false,
		})
		return {
			encodedCopyButtonEnabled: config.encodedCopyButton,
			showAttachEmailForm: false,
			submittingAttachEmail: false,
			isComponentMounted: false,
		}
	},

	computed: {
		clipboardKinds() {
			return {
				inviteLink: CLIPBOARD_KIND_INVITE_LINK,
				inviteCode: CLIPBOARD_KIND_INVITE_CODE,
				encodedInvite: CLIPBOARD_KIND_ENCODED_INVITE,
			}
		},

		invite() {
			return this.ocminvitesStore.getOcmInvite(this.inviteKey)
		},

		...mapStores(useOcmInvitesStore),

		provider() {
			return window.location.host
		},

		wayfLink() {
			if (!this.invite) {
				return ''
			}
			const wayfUrl = new URL(generateUrl('/apps/contacts/wayf'), window.location.origin)
			wayfUrl.searchParams.set('token', this.invite.token)
			wayfUrl.searchParams.set('providerDomain', this.provider)
			return wayfUrl.toString()
		},

		plainInviteString() {
			if (!this.invite) {
				return ''
			}
			return `${this.invite.token}@${this.provider}`
		},

		base64InviteString() {
			if (!this.invite) {
				return ''
			}
			return btoa(this.plainInviteString)
		},
	},

	mounted() {
		this.isComponentMounted = true
	},

	beforeUnmount() {
		this.isComponentMounted = false
	},

	methods: {
		onCopyAction({ text, kind }) {
			this.copyToClipboard(text, kind)
		},

		formatDate(date) {
			// moment takes milliseconds
			return moment(date * 1000).format(dateFormat)
		},

		async copyToClipboard(text, kind) {
			try {
				await navigator.clipboard.writeText(text)
				let message
				switch (kind) {
					case CLIPBOARD_KIND_INVITE_CODE:
						message = this.t('contacts', 'Invite code copied to clipboard')
						break
					case CLIPBOARD_KIND_ENCODED_INVITE:
						message = this.t('contacts', 'Encoded invite code copied to clipboard')
						break
					case CLIPBOARD_KIND_INVITE_LINK:
						message = this.t('contacts', 'Invite link copied to clipboard')
						break
					default:
						message = this.t('contacts', 'Copied to clipboard')
				}
				showSuccess(message)
			} catch (error) {
				showError(this.t('contacts', 'Failed to copy to clipboard'))
			}
		},

		async onResend() {
			try {
				const response = await this.ocminvitesStore.resendOcmInvite(this.invite)
				window.location.assign(response.data.invite)
			} catch (error) {
				const serverMessage = error?.response?.data?.message
				showError(serverMessage || this.t('contacts', 'Could not resend invite'))
			}
		},

		async onRevoke() {
			if (!this.invite) {
				return
			}
			try {
				await this.ocminvitesStore.deleteOcmInvite(this.invite)
				showSuccess(this.t('contacts', 'Invite revoked'))
			} catch (error) {
				const serverMessage = error?.response?.data?.message
				showError(serverMessage || this.t('contacts', 'Could not revoke invite'))
			}
		},

		openAttachEmailForm() {
			this.showAttachEmailForm = true
		},

		closeAttachEmailForm() {
			if (this.submittingAttachEmail) {
				return
			}
			this.showAttachEmailForm = false
		},

		async onAttachEmailSubmit({ email, message }) {
			if (!this.invite) {
				return
			}
			this.submittingAttachEmail = true
			try {
				await this.ocminvitesStore.attachEmailAndSendOcmInvite({
					token: this.invite.token,
					email,
					message,
				})
				if (!this.isComponentMounted) {
					return
				}
				showSuccess(this.t('contacts', 'Invite sent to {email}', { email }))
				this.showAttachEmailForm = false
			} catch (error) {
				if (!this.isComponentMounted) {
					return
				}
				const serverMessage = error?.response?.data?.message
				showError(serverMessage || this.t('contacts', 'Could not send invite'))
			} finally {
				if (this.isComponentMounted) {
					this.submittingAttachEmail = false
				}
			}
		},
	},

}
</script>

<style lang="scss" scoped>
.empty-content {
	margin-top: 5em;
}

.invite-details {
	padding: 1.5em;
	max-width: 600px;

	h2 {
		margin: 0 0 1.5em 0;
		font-size: 1.4em;
		font-weight: 600;
	}

	h3 {
		margin: 0 0 0.75em 0;
		font-size: 1em;
		font-weight: 600;
		color: var(--color-text-maxcontrast);
	}
}

.invite-info {
	margin-bottom: 2em;

	.info-row {
		display: flex;
		padding: 0.6em 0;
		border-bottom: 1px solid var(--color-border-dark);

		&:last-child {
			border-bottom: none;
		}

		.info-label {
			flex: 0 0 100px;
			font-weight: 500;
			color: var(--color-text-maxcontrast);
		}

		.info-value {
			flex: 1;
			overflow-wrap: anywhere;
		}
	}
}

.share-section {
	margin-bottom: 1.5em;
	padding: 1em;
	background: var(--color-background-dark);
	border-radius: var(--border-radius-large);

	.share-hint {
		font-size: 0.85em;
		color: var(--color-text-maxcontrast);
		margin-bottom: 0.75em;
	}
}

.share-section--collapsible {
	&[open] .share-section__summary::after {
		transform: rotate(90deg);
	}

	.share-section__summary {
		cursor: pointer;
		user-select: none;
		font-weight: 600;
		font-size: 0.95em;
		color: var(--color-text-maxcontrast);
		list-style: none;
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.25em 0;
		border-radius: var(--border-radius);

		&::-webkit-details-marker {
			display: none;
		}

		&:focus-visible {
			outline: 2px solid var(--color-primary-element);
			outline-offset: 2px;
		}

		&::after {
			content: '';
			display: inline-block;
			width: 0;
			height: 0;
			margin-inline-start: auto;
			border-block-start: 5px solid transparent;
			border-block-end: 5px solid transparent;
			border-inline-start: 6px solid currentColor;
			transition: transform 0.15s ease-in-out;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.share-section__summary::after {
			transition: none;
		}
	}

	.share-hint {
		margin-top: 0.5em;
	}
}

.action-buttons {
	display: flex;
	gap: 0.5em;

	@media (max-width: 400px) {
		flex-direction: column;
	}
}
</style>
