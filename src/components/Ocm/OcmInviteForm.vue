<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="contact-header__infos">
		<h5>{{ t('contacts', 'Invite someone outside your organization to collaborate.') }}</h5>
		<p>{{ t('contacts', 'After the invitee accepts the invite, both of you will appear in each other\'s contacts list and you can start sharing data with each other.') }}</p>

		<div class="form-field">
			<NcTextField
				type="text"
				:label="t('contacts', 'Invite label (for your reference)')"
				:placeholder="t('contacts', 'e.g. Mahdi from OCM')"
				:model-value="ocmInvite.note"
				:disabled="loadingUpdate"
				data-testid="ocm-invite-note-input"
				@input="setNote" />
			<p class="hint">
				{{ t('contacts', 'A name or note to help you identify this invite') }}
			</p>
		</div>

		<div class="email-section">
			<!-- Only show toggle if optional mail is enabled -->
			<label v-if="optionalMailEnabled" class="email-toggle">
				<input
					v-model="sendEmail"
					type="checkbox"
					:disabled="loadingUpdate"
					data-testid="ocm-invite-send-email-checkbox">
				<span>{{ t('contacts', 'Send invite via email') }}</span>
			</label>
			<div v-if="showEmailFields" class="email-fields">
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
				<!-- CC checkbox - only show if enabled in config -->
				<label v-if="ccSenderEnabled" class="cc-toggle">
					<input
						v-model="ccSender"
						type="checkbox"
						:disabled="loadingUpdate"
						data-testid="ocm-invite-cc-sender-checkbox">
					<span>{{ t('contacts', 'Also send a copy of this invite to me') }}</span>
				</label>
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
import { loadState } from '@nextcloud/initial-state'
import { NcTextArea, NcTextField } from '@nextcloud/vue'

export default {
	name: 'OcmInviteForm',
	components: {
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
			ccSender: true,
			encodedCopyButton: false,
		})
		return {
			sendEmail: !config.optionalMail,
			ccSender: false,
			optionalMailEnabled: config.optionalMail,
			ccSenderEnabled: config.ccSender,
		}
	},

	computed: {
		showEmailFields() {
			// Always show if optional mail is disabled (email required)
			// Otherwise show based on sendEmail toggle
			return !this.optionalMailEnabled || this.sendEmail
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
					this.ccSender = false
				}
				this.updateInvite(patch)
			},
		},

		ccSender(newVal) {
			this.updateInvite({ ccSender: newVal })
		},
	},

	methods: {
		updateInvite(patch) {
			this.$emit('update:ocmInvite', { ...this.ocmInvite, ...patch })
		},

		setNote(e) {
			this.updateInvite({ note: e.target.value })
		},

		setEmail(e) {
			this.updateInvite({ email: e.target.value })
		},
	},
}
</script>

<style lang="scss" scoped>
.contact-header__infos {
	margin: 1em;

	h5 {
		margin: 0 0 0.5em 0;
	}

	> p {
		margin-bottom: 1.5em;
		color: var(--color-text-maxcontrast);
	}

	.hint {
		font-size: 0.85em;
		color: var(--color-text-maxcontrast);
		margin-top: 0.5em;
		margin-bottom: 0;
	}

	.form-field {
		margin-bottom: 1.5em;
	}

	.email-section {
		padding: 1em;
		background: var(--color-background-dark);
		border-radius: var(--border-radius-large);
		margin-bottom: 1.5em;

		.email-toggle,
		.cc-toggle {
			display: flex;
			align-items: center;
			gap: 0.5em;
			cursor: pointer;
			user-select: none;
			margin-bottom: 0.5em;

			input[type="checkbox"] {
				width: 18px;
				height: 18px;
				cursor: pointer;
				accent-color: var(--color-primary);
			}

			span {
				font-weight: 500;
			}
		}

		.cc-toggle {
			margin-top: 0.5em;
			margin-bottom: 0;

			span {
				font-weight: normal;
				font-size: 0.9em;
			}
		}

		.email-fields {
			display: flex;
			flex-direction: column;
			gap: 1em;
			margin-top: 1em;
		}

		.hint {
			margin-top: 0.5em;
		}
	}

	.actions {
		margin-top: 1em;
	}
}
</style>
