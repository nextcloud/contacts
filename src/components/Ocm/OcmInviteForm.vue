<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="ocm-invite-form">
		<div class="ocm-invite-form__heading">
			<h3 class="ocm-invite-form__title">
				{{ t('contacts', 'Invite someone outside your organization to collaborate') }}
			</h3>
		</div>
		<p class="ocm-invite-form__intro">
			{{ t('contacts', 'After the invitee accepts the invite, both of you will appear in each other\'s contacts list and you can start sharing data with each other.') }}
		</p>

		<!-- Only show toggle if optional mail is enabled -->
		<NcCheckboxRadioSwitch
			v-if="optionalMailEnabled"
			:model-value="sendEmail"
			:disabled="loadingUpdate"
			data-testid="ocm-invite-send-email-checkbox"
			@update:model-value="sendEmail = $event">
			{{ t('contacts', 'Send invite via email') }}
		</NcCheckboxRadioSwitch>
		<div v-if="showEmailFields" class="ocm-invite-form__fields">
			<NcTextField
				type="email"
				:label="emailLabel"
				:placeholder="t('contacts', 'email@example.com')"
				:model-value="ocmInvite.email"
				:required="emailRequired"
				:disabled="loadingUpdate"
				inputmode="email"
				data-testid="ocm-invite-email-input"
				@input="setEmail" />
			<NcTextArea
				v-model="messageModel"
				:label="t('contacts', 'Personal message (optional)')"
				:placeholder="t('contacts', 'Message to include in the email')"
				:rows="3"
				:disabled="loadingUpdate"
				data-testid="ocm-invite-message-input" />
			<!-- Collapsible preview of the email the recipient will receive -->
			<div class="ocm-invite-form__preview">
				<NcButton
					variant="tertiary"
					class="ocm-invite-form__preview-toggle"
					:aria-expanded="showPreview"
					data-testid="ocm-invite-preview-toggle"
					@click="showPreview = !showPreview">
					<template #icon>
						<IconChevronUp v-if="showPreview" :size="20" />
						<IconChevronDown v-else :size="20" />
					</template>
					{{ showPreview ? t('contacts', 'Hide email preview') : t('contacts', 'Show email preview') }}
				</NcButton>
				<div v-if="showPreview" class="ocm-invite-form__preview-panel" data-testid="ocm-invite-preview-panel">
					<p v-if="previewRecipient" class="ocm-invite-form__preview-caption">
						{{ t('contacts', 'This is what {recipient} will receive:', { recipient: previewRecipient }) }}
					</p>
					<div class="ocm-invite-form__preview-body" v-text="emailPreview" />
				</div>
			</div>
			<p v-if="optionalMailEnabled && !sendEmail" class="hint">
				{{ t('contacts', 'If you do not send an email, you will need to share the invite link yourself.') }}
			</p>
		</div>

		<div class="actions">
			<slot name="new-invite-actions" />
		</div>
	</div>
</template>

<script>
import { getCurrentUser } from '@nextcloud/auth'
import { loadState } from '@nextcloud/initial-state'
import { NcButton, NcCheckboxRadioSwitch, NcTextArea, NcTextField } from '@nextcloud/vue'
import IconChevronDown from 'vue-material-design-icons/ChevronDown.vue'
import IconChevronUp from 'vue-material-design-icons/ChevronUp.vue'

export default {
	name: 'OcmInviteForm',
	components: {
		IconChevronDown,
		IconChevronUp,
		NcButton,
		NcCheckboxRadioSwitch,
		NcTextField,
		NcTextArea,
	},

	props: {
		ocmInvite: {
			type: Object,
			required: true,
		},

		loadingUpdate: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['update:ocmInvite'],
	data() {
		const config = loadState('contacts', 'ocmInvitesConfig', {
			optionalMail: false,
		})
		const currentUser = getCurrentUser()
		return {
			sendEmail: !config.optionalMail,
			optionalMailEnabled: config.optionalMail,
			showPreview: false,
			senderName: currentUser?.displayName || currentUser?.uid || '',
		}
	},

	computed: {
		showEmailFields() {
			// Always show if optional mail is disabled (email required)
			// Otherwise show based on sendEmail toggle
			return !this.optionalMailEnabled || this.sendEmail
		},

		previewRecipient() {
			return (this.ocmInvite.email ?? '').trim()
		},

		/**
		 * Plain-text reconstruction of the invitation email body so the sender
		 * can preview how their personal message reads in context. Mirrors the
		 * body assembled server-side in FederatedInvitesController; the actual
		 * invite link and code are added when the invitation is sent.
		 *
		 * @return {string}
		 */
		emailPreview() {
			const message = (this.ocmInvite.message ?? '').trim()
			const lines = [
				this.t('contacts', 'Hi there,'),
				'',
				this.t('contacts', '{name} invites you to exchange cloud accounts and contact information.', { name: this.senderName }),
				this.t('contacts', 'This will allow you to share data with each other.'),
			]
			if (message !== '') {
				lines.push('---', message, '---')
			}
			lines.push(
				'',
				this.t('contacts', 'To accept this invite, click the link below and sign in with your cloud provider:'),
				this.t('contacts', 'The invite link and code are added automatically when you send the invitation.'),
			)
			return lines.join('\n')
		},

		emailRequired() {
			return !this.optionalMailEnabled || this.sendEmail
		},

		emailLabel() {
			return this.emailRequired
				? this.t('contacts', 'Recipient email (required)')
				: this.t('contacts', 'Recipient email')
		},

		messageModel: {
			get() {
				return this.ocmInvite.message ?? ''
			},

			set(value) {
				this.updateInvite({ message: value })
			},
		},
	},

	watch: {
		sendEmail: {
			immediate: true,
			handler(newVal, oldVal) {
				const patch = { sendEmail: newVal }
				// Clear pre-filled fields only when the user explicitly toggles the
				// switch off (oldVal is defined). On the first immediate fire
				// (oldVal === undefined) we must preserve any prefill the parent
				// passed in via v-model:ocm-invite.
				if (!newVal && oldVal !== undefined) {
					patch.email = ''
					patch.message = ''
				}
				this.updateInvite(patch)
			},
		},
	},

	methods: {
		updateInvite(patch) {
			this.$emit('update:ocmInvite', { ...this.ocmInvite, ...patch })
		},

		setEmail(e) {
			this.updateInvite({ email: e.target.value })
		},
	},
}
</script>

<style lang="scss" scoped>
.ocm-invite-form {
	margin: calc(var(--default-grid-baseline) * 4);

	&__intro {
		margin-bottom: calc(var(--default-grid-baseline) * 6);
		color: var(--color-text-maxcontrast);
	}

	.hint {
		font-size: 0.85em;
		color: var(--color-text-maxcontrast);
		margin-top: calc(var(--default-grid-baseline) * 2);
		margin-bottom: 0;
	}

	.form-field {
		margin-bottom: calc(var(--default-grid-baseline) * 6);
	}

	&__fields {
		display: flex;
		flex-direction: column;
		gap: calc(var(--default-grid-baseline) * 3);
	}

	&__title {
		margin-top: 0;
	}

	&__preview {
		display: flex;
		flex-direction: column;
		gap: calc(var(--default-grid-baseline) * 2);
	}

	&__preview-toggle {
		margin-inline-start: 0;
	}

	&__preview-caption {
		font-size: 0.85em;
		color: var(--color-text-maxcontrast);
		margin: 0 0 calc(var(--default-grid-baseline) * 2) 0;
	}

	&__preview-body {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		font-size: 0.9em;
		line-height: 1.5;
		padding: calc(var(--default-grid-baseline) * 3);
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius-large);
		background-color: var(--color-background-hover);
		color: var(--color-main-text);
	}

	.actions {
		margin-top: calc(var(--default-grid-baseline) * 4);
	}
}
</style>
