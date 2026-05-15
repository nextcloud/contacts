<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="contact-header__infos" :aria-busy="loading">
		<h5>{{ t('contacts', 'Send this invite via email') }}</h5>
		<p>{{ t('contacts', 'The recipient will receive an email with the invite link. Their email address will be saved on the invite so you can resend later.') }}</p>

		<div class="form-field">
			<NcTextField
				ref="emailField"
				type="email"
				:label="t('contacts', 'Recipient email (required)')"
				:placeholder="t('contacts', 'email@example.com')"
				:model-value="email"
				:error="Boolean(error)"
				:helper-text="error || ''"
				:required="true"
				inputmode="email"
				autocomplete="email"
				data-testid="ocm-invite-attach-email-input"
				@input="onEmailInput" />
		</div>

		<div class="form-field">
			<NcTextArea
				v-model="message"
				:label="t('contacts', 'Personal message (optional)')"
				:placeholder="t('contacts', 'Message to include in the email')"
				:rows="3"
				data-testid="ocm-invite-attach-email-message-input" />
		</div>

		<div class="actions">
			<NcButton
				variant="tertiary"
				:disabled="loading"
				data-testid="ocm-invite-attach-email-cancel-btn"
				@click="onCancel">
				{{ t('contacts', 'Cancel') }}
			</NcButton>
			<NcButton
				variant="primary"
				:disabled="!canSubmit"
				data-testid="ocm-invite-attach-email-submit-btn"
				@click="onSubmit">
				<template #icon>
					<EmailFastOutlineIcon :size="20" />
				</template>
				{{ loading ? t('contacts', 'Sending…') : t('contacts', 'Send') }}
			</NcButton>
		</div>
	</div>
</template>

<script>
import { NcButton, NcTextArea, NcTextField } from '@nextcloud/vue'
import EmailFastOutlineIcon from 'vue-material-design-icons/EmailFastOutline.vue'

export default {
	name: 'OcmAttachEmailForm',
	components: {
		NcButton,
		NcTextArea,
		NcTextField,
		EmailFastOutlineIcon,
	},

	props: {
		loading: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['submit', 'cancel'],
	data() {
		return {
			email: '',
			message: '',
			error: '',
		}
	},

	computed: {
		canSubmit() {
			return !this.loading && this.email.trim().length > 0
		},
	},

	mounted() {
		// NcModal activates its focus trap on nextTick, then yields to the
		// browser. Two animation frames is enough to land focus inside the
		// trap without a visible flicker. See @nextcloud/vue useFocusTrap.
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.$refs.emailField?.focus?.()
			})
		})
	},

	methods: {
		onEmailInput(event) {
			this.email = event.target.value
			this.error = ''
		},

		onSubmit() {
			const email = this.email.trim()
			if (email.length === 0) {
				this.error = this.t('contacts', 'Please enter an email address.')
				return
			}
			this.$emit('submit', { email, message: this.message })
		},

		onCancel() {
			this.$emit('cancel')
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

	.form-field {
		margin-bottom: 1em;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5em;
		margin-top: 1em;
	}
}
</style>
