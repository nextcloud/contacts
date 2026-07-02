<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="ocm_manual_form">
		<div class="ocm_manual_form__heading">
			<h3 class="ocm_manual_form__title">
				{{ t('contacts', 'Accept invitation') }}
			</h3>
		</div>
		<p>
			{{ t('contacts', 'Accepting will add the inviter to your contacts list and in return, your contact info will be sent to the inviter. From there on you can start sharing data with each other.') }}
		</p>

		<NcTextField
			v-model="invite"
			:label="t('contacts', 'Invite link or code (required)')"
			type="text"
			:error="Boolean(error)"
			:helper-text="error || t('contacts', 'Paste the invite link, or an invite code (token@provider), you received from the other person.')"
			:required="true" />

		<div class="ocm_manual_buttons">
			<NcButton variant="tertiary" :disabled="loadingUpdate" @click="cancel">
				{{ t('contacts', 'Cancel') }}
			</NcButton>
			<NcButton variant="primary" :disabled="loadingUpdate" @click="accept">
				<template #icon>
					<NcLoadingIcon v-if="loadingUpdate" :size="20" />
					<IconCheck v-else :size="20" />
				</template>
				{{ t('contacts', 'Accept') }}
			</NcButton>
		</div>
	</div>
</template>

<script>
import NcButton from '@nextcloud/vue/components/NcButton'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'
import NcTextField from '@nextcloud/vue/components/NcTextField'
import IconCheck from 'vue-material-design-icons/Check.vue'

export default {
	name: 'OcmAcceptForm',
	components: {
		NcTextField,
		NcButton,
		NcLoadingIcon,
		IconCheck,
	},

	props: {
		loadingUpdate: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['accept', 'cancel'],
	data() {
		return {
			invite: '',
			error: '',
		}
	},

	methods: {
		parseInvite(str) {
			function looksLikeUrl(s) {
				return /^[a-z][a-z0-9+.-]*:\/\//i.test(s)
			}

			// Try to parse token@provider format
			function tryParseTokenProvider(s) {
				const idx = s.lastIndexOf('@')
				if (idx === -1) {
					return null
				}
				const token = s.slice(0, idx).trim()
				const provider = s.slice(idx + 1).trim()
				if (!token || !provider) {
					return null
				}
				return { provider, token }
			}

			// Try to parse as URL with token query parameter
			function tryParseUrl(s) {
				try {
					const url = new URL(s)
					const token = url.searchParams.get('token')
					if (!token) {
						return null
					}
					// Provider must come from the invite payload itself. Falling back
					// to the current URL host silently turns incomplete links into the
					// wrong remote target.
					const provider = url.searchParams.get('providerDomain') || url.searchParams.get('provider')
					if (!provider) {
						return null
					}
					return { provider, token }
				} catch (e) {
					return null
				}
			}

			const s = String(str || '').trim()
			if (looksLikeUrl(s)) {
				const result = tryParseUrl(s)
				if (result) {
					return result
				}
				throw new Error('Could not parse invite')
			}

			// 1. Try token@provider format first
			let result = tryParseTokenProvider(s)
			if (result) {
				return result
			}

			// 2. Try base64 decoding then token@provider
			try {
				const decoded = atob(s)
				if (looksLikeUrl(decoded)) {
					result = tryParseUrl(decoded)
					if (result) {
						return result
					}
				}
				result = tryParseTokenProvider(decoded)
				if (result) {
					return result
				}
			} catch (e) {
				// Not base64, continue
			}

			// 3. Try as URL
			result = tryParseUrl(s)
			if (result) {
				return result
			}

			throw new Error('Could not parse invite')
		},

		accept() {
			this.error = ''
			try {
				const { provider, token } = this.parseInvite(this.invite)
				this.$emit('accept', { provider, token })
			} catch (e) {
				this.error = this.t('contacts', 'This invite does not look valid. Check that you copied it completely or ask the sender to generate a new one.')
			}
		},

		cancel() {
			this.$emit('cancel')
		},
	},
}
</script>

<style lang="scss" scoped>
.ocm_manual_buttons {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--default-grid-baseline) * 2);
}

.ocm_manual_form {
  display: flex;
  flex-direction: column;
  gap: calc(var(--default-grid-baseline) * 4);
  margin: calc(var(--default-grid-baseline) * 4);
  p {
    margin-bottom: calc(var(--default-grid-baseline) * 4);
  }
  :deep(.input-field__helper-text-message) {
	word-break: initial;
  }
  &__title {
	margin-top: 0;
  }
}
</style>
