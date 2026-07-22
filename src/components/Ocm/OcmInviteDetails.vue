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
			:name="t('contacts', 'No invitation selected')"
			:description="t('contacts', 'Select an invitation on the list to begin')">
			<template #icon>
				<IconAccountSwitchOutline :size="20" />
			</template>
		</NcEmptyContent>

		<template v-else>
			<div class="invite-details">
				<h2>{{ t('contacts', 'External invitation') }}</h2>

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

				<!-- More ways to share (collapsible) -->
				<div class="more-ways" data-testid="ocm-invite-share-section">
					<button
						type="button"
						class="more-ways__header"
						:aria-expanded="showShare"
						data-testid="ocm-invite-share-toggle"
						@click="showShare = !showShare">
						<span class="more-ways__title">{{ t('contacts', 'More ways to share') }}</span>
						<IconChevronUp v-if="showShare" :size="20" />
						<IconChevronDown v-else :size="20" />
					</button>
					<div v-if="showShare" class="more-ways__content">
						<p class="more-ways__hint">
							{{ t('contacts', 'Useful for sharing through a chat app or for manual acceptance.') }}
						</p>
						<OcmInviteShareActions
							:invite-link="wayfLink"
							:invite-code="inviteCode"
							:encoded-invite="base64InviteString"
							:clipboard-kinds="clipboardKinds"
							:encoded-copy-button-enabled="encodedCopyButtonEnabled"
							@copy="onCopyAction" />
					</div>
				</div>

				<!-- Action buttons -->
				<div class="action-buttons">
					<NcButton
						variant="error"
						class="action-buttons__revoke"
						data-testid="ocm-invite-revoke-btn"
						@click="onRevoke">
						{{ t('contacts', 'Revoke invitation') }}
					</NcButton>
					<NcButton
						v-if="invite.recipientEmail"
						variant="primary"
						class="action-buttons__primary"
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
						class="action-buttons__primary"
						data-testid="ocm-invite-attach-email-btn"
						@click="openAttachEmailForm">
						<template #icon>
							<EmailFastOutlineIcon :size="20" />
						</template>
						{{ t('contacts', 'Send via email') }}
					</NcButton>
				</div>
			</div>
		</template>

		<Modal
			v-if="showAttachEmailForm"
			v-model:show="showAttachEmailForm"
			:name="t('contacts', 'Send invitation via email')"
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
import IconChevronDown from 'vue-material-design-icons/ChevronDown.vue'
import IconChevronUp from 'vue-material-design-icons/ChevronUp.vue'
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
		IconChevronDown,
		IconChevronUp,
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
			encodedCopyButton: false,
		})
		return {
			encodedCopyButtonEnabled: config.encodedCopyButton,
			showAttachEmailForm: false,
			submittingAttachEmail: false,
			isComponentMounted: false,
			showShare: false,
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

		inviteCode() {
			if (!this.invite) {
				return ''
			}
			return `${this.invite.token}@${this.provider}`
		},

		base64InviteString() {
			if (!this.invite) {
				return ''
			}
			return btoa(`${this.invite.token}@${this.provider}`)
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
					case CLIPBOARD_KIND_ENCODED_INVITE:
						message = this.t('contacts', 'Encoded invite copied to clipboard')
						break
					case CLIPBOARD_KIND_INVITE_CODE:
						message = this.t('contacts', 'Invite code copied to clipboard')
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
	margin-top: calc(var(--default-grid-baseline) * 20);
}

.invite-details {
	padding: calc(var(--default-grid-baseline) * 6);
	max-width: 600px;

	h2 {
		margin: 0 0 calc(var(--default-grid-baseline) * 6) 0;
		font-size: 1.4em;
		font-weight: 600;
	}

	h3 {
		margin: 0 0 calc(var(--default-grid-baseline) * 3) 0;
		font-size: 1em;
		font-weight: 600;
		color: var(--color-text-maxcontrast);
	}
}

.invite-info {
	margin-bottom: calc(var(--default-grid-baseline) * 8);

	.info-row {
		display: flex;
		padding: calc(var(--default-grid-baseline) * 2) 0;
		border-bottom: 1px solid var(--color-border);

		&:last-child {
			border-bottom: none;
		}

		.info-label {
			flex: 0 0 calc(var(--default-grid-baseline) * 25);
			font-weight: 500;
			color: var(--color-text-maxcontrast);
		}

		.info-value {
			flex: 1;
			overflow-wrap: anywhere;
		}
	}
}

.more-ways {
	margin-bottom: calc(var(--default-grid-baseline) * 6);
	border: 1px solid var(--color-border);
	border-radius: var(--border-radius-large);
	overflow: hidden;

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: calc(var(--default-grid-baseline) * 2);
		width: 100%;
		padding: calc(var(--default-grid-baseline) * 3);
		border: none;
		background-color: transparent;
		color: var(--color-main-text);
		font-weight: 500;
		cursor: pointer;

		&:hover {
			background-color: var(--color-background-hover);
		}

		&:focus-visible {
			outline: 2px solid var(--color-primary-element);
			outline-offset: -2px;
			background-color: var(--color-background-hover);
		}
	}

	&__title {
		text-align: start;
	}

	&__content {
		padding: 0 calc(var(--default-grid-baseline) * 3) calc(var(--default-grid-baseline) * 3);
	}

	&__hint {
		font-size: 0.85em;
		color: var(--color-text-maxcontrast);
		margin: 0 0 calc(var(--default-grid-baseline) * 3) 0;
	}
}

.action-buttons {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: calc(var(--default-grid-baseline) * 3);

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: stretch;

		.action-buttons__primary,
		.action-buttons__revoke {
			margin-inline-start: 0;
			width: 100%;
		}
	}
}
</style>
