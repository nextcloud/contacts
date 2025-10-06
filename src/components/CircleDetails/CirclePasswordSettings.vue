<!--
  - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<ul>
		<li class="circle-config">
			<ul class="circle-config__list">
				<CheckboxRadioSwitch
					:model-value="enforcePasswordProtection"
					:loading="loading.includes(ENFORCE_PASSWORD_PROTECTION)"
					:disabled="loading.length > 0"
					wrapper-element="li"
					@update:model-value="changePasswordProtection">
					{{ t('contacts', 'Enforce password protection on files shared to this team') }}
				</CheckboxRadioSwitch>

				<CheckboxRadioSwitch
					v-if="enforcePasswordProtection"
					:model-value="useUniquePassword || showUniquePasswordInput"
					:loading="loading.includes(USE_UNIQUE_PASSWORD)"
					:disabled="loading.length > 0"
					wrapper-element="li"
					@update:model-value="changeUseUniquePassword">
					{{ t('contacts', 'Use a unique password for all shares to this team') }}
				</CheckboxRadioSwitch>

				<li class="unique-password">
					<template v-if="showUniquePasswordInput">
						<input
							v-model="uniquePassword"
							:disabled="loading.length > 0"
							:placeholder="t('contacts', 'Unique password …')"
							type="text"
							@keyup.enter="saveUniquePassword">
						<NcButton
							variant="tertiary-no-background"
							:disabled="loading.length > 0 || uniquePassword.length === 0"
							@click="saveUniquePassword">
							{{ t('contacts', 'Save') }}
						</NcButton>
					</template>
					<NcButton
						v-else-if="useUniquePassword"
						class="change-unique-password"
						@click="onClickChangePassword">
						{{ t('contacts', 'Change unique password') }}
					</NcButton>

					<div v-if="uniquePasswordError" class="unique-password-error">
						{{ t('contacts', 'Failed to save password. Please try again later.') }}
					</div>
				</li>
			</ul>
		</li>
	</ul>
</template>

<script>
import {
	NcCheckboxRadioSwitch as CheckboxRadioSwitch,
	NcButton,
} from '@nextcloud/vue'

// Circle setting keys
const ENFORCE_PASSWORD_PROTECTION = 'enforce_password'
const USE_UNIQUE_PASSWORD = 'password_single_enabled'
const UNIQUE_PASSWORD = 'password_single'

export default {
	name: 'CirclePasswordSettings',
	components: {
		CheckboxRadioSwitch,
		NcButton,
	},

	props: {
		circle: {
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			ENFORCE_PASSWORD_PROTECTION,
			USE_UNIQUE_PASSWORD,
			UNIQUE_PASSWORD,

			loading: [],

			uniquePassword: '',
			uniquePasswordError: false,
			showUniquePasswordInput: false,
		}
	},

	computed: {
		/**
		 * @return {string}
		 */
		circleId() {
			return this.circle._data.id
		},

		/**
		 * @return {boolean}
		 */
		enforcePasswordProtection() {
			const value = this.circle._data.settings[ENFORCE_PASSWORD_PROTECTION]
			return value === '1' || value === 'true'
		},

		/**
		 * @return {boolean}
		 */
		useUniquePassword() {
			const value = this.circle._data.settings[USE_UNIQUE_PASSWORD]
			return value === '1' || value === 'true'
		},
	},

	methods: {
		/**
		 * Change handler for enforcePasswordProtection checkbox.
		 */
		async changePasswordProtection() {
			this.loading.push(ENFORCE_PASSWORD_PROTECTION)
			try {
				const newValue = !this.enforcePasswordProtection

				// Also disable unique password setting
				if (!newValue && this.useUniquePassword) {
					await this.saveUseUniquePassword(false)
				}

				// Also hide password input
				if (!newValue && this.showUniquePasswordInput) {
					this.showUniquePasswordInput = false
				}

				await this.$store.dispatch('editCircleSetting', {
					circleId: this.circleId,
					setting: {
						setting: ENFORCE_PASSWORD_PROTECTION,
						value: newValue.toString(),
					},
				})
			} finally {
				this.loading = this.loading.filter((item) => item !== ENFORCE_PASSWORD_PROTECTION)
			}
		},

		/**
		 * Change handler for useUniquePassword checkbox.
		 */
		async changeUseUniquePassword() {
			// Only update backend if the user disables the setting.
			// It will be enabled once a unique password has been set.
			if (!this.useUniquePassword) {
				this.showUniquePasswordInput = !this.showUniquePasswordInput
				return
			}

			await this.saveUseUniquePassword(!this.useUniquePassword)
		},

		/**
		 * Update backend with given value for useUniquePassword.
		 *
		 * @param {boolean} value New value
		 */
		async saveUseUniquePassword(value) {
			this.loading.push(USE_UNIQUE_PASSWORD)
			try {
				await this.$store.dispatch('editCircleSetting', {
					circleId: this.circleId,
					setting: {
						setting: USE_UNIQUE_PASSWORD,
						value: value.toString(),
					},
				})

				// Reset unique password input state if disabled
				if (!value) {
					this.uniquePassword = ''
					this.showUniquePasswordInput = false
				}
			} finally {
				this.loading = this.loading.filter((item) => item !== USE_UNIQUE_PASSWORD)
			}
		},

		/**
		 * Persist uniquePassword to backend.
		 */
		async saveUniquePassword() {
			if (this.uniquePassword.length === 0) {
				return
			}

			this.loading.push(UNIQUE_PASSWORD)
			this.uniquePasswordError = false
			try {
				if (!this.useUniquePassword) {
					await this.saveUseUniquePassword(true)
				}

				await this.$store.dispatch('editCircleSetting', {
					circleId: this.circleId,
					setting: {
						setting: UNIQUE_PASSWORD,
						value: this.uniquePassword,
					},
				})

				// Show change NcButton after saving the password
				this.showUniquePasswordInput = false
				this.uniquePassword = ''
			} catch {
				this.uniquePasswordError = true
			} finally {
				this.loading = this.loading.filter((item) => item !== UNIQUE_PASSWORD)
			}
		},

		/**
		 * Click handler for the NcButton to show the uniquePassword input.
		 */
		onClickChangePassword() {
			this.showUniquePasswordInput = true
		},
	},
}
</script>

<style lang="scss" scoped>
ul {
	margin-top: -12px; // Merge with privacy settings list
}

.unique-password {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	width: 100%;

	input {
		flex: 1 auto;
		max-width: 200px;
	}

	.change-unique-password {
		margin-top: 5px;
	}

	// Force wrap error into a new line
	.unique-password-error {
		flex: 1 100%;
	}
}
</style>
