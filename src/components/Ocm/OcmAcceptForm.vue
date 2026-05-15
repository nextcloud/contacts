<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="ocm_manual_form">
		<h5>
			{{ t('contacts', 'Accept invite to exchange contact info.') }}
		</h5>
		<p>
			{{ t('contacts', 'Accepting will add the inviter to your contacts list and in return, your contact info will be sent to the inviter. From there on you can start sharing data with each other.') }}
		</p>

		<div class="ocm_manual_inputs">
			<NcTextField
				v-model="invite"
				:label="t('contacts', 'Invite link, invite code, or encoded invite code (required)')"
				type="text"
				:error="Boolean(error)"
				:helper-text="error || t('contacts', 'Paste an invite link, invite code (token@provider), or encoded invite code')"
				:required="true" />

			<div class="ocm_manual_buttons">
				<NcButton :disabled="loadingUpdate" @click="accept">
					<template #icon>
						<NcLoadingIcon v-if="loadingUpdate" :size="20" />
						<IconCheck v-else :size="20" />
					</template>
					{{ t('contacts', 'Accept') }}
				</NcButton>
				<NcButton :disabled="loadingUpdate" @click="cancel">
					<template #icon>
						<NcLoadingIcon v-if="loadingUpdate" :size="20" />
						<IconCancel v-else :size="20" />
					</template>
					{{ t('contacts', 'Cancel') }}
				</NcButton>
			</div>
		</div>
	</div>
</template>

<script>
import NcButton from '@nextcloud/vue/components/NcButton'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'
import NcTextField from '@nextcloud/vue/components/NcTextField'
import IconCancel from 'vue-material-design-icons/Cancel.vue'
import IconCheck from 'vue-material-design-icons/Check.vue'

export default {
	name: 'OcmAcceptForm',
	components: {
		NcTextField,
		NcButton,
		NcLoadingIcon,
		IconCheck,
		IconCancel,
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
  gap: 0.5rem;
}

.ocm_manual_form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1em;
  p {
    margin-bottom: 1em;
  }

  div.ocm_manual_inputs {
    margin-inline-start: 0.2em;
    width: 80%;
  }
}
</style>
