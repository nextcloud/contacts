<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="new-addressbook-entry">
		<IconLoading v-if="loading" :size="20" />
		<NcInputField v-model:model-value="displayName"
			class="new-addressbook"
			:disabled="loading"
			:label="t('contacts', 'Add new address book')"
			:show-trailing-button="true"
			:trailing-button-label="t('contacts', 'Add')"
			:error="inputErrorState"
			type="text"
			autocomplete="off"
			autocorrect="off"
			spellcheck="false"
			@trailing-button-click="addAddressbook">
			<template #trailing-button-icon>
				<IconAdd :size="20" />
			</template>
		</NcInputField>
	</div>
</template>

<script>
import { NcInputField } from '@nextcloud/vue'
import { showError } from '@nextcloud/dialogs'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import IconLoading from 'vue-material-design-icons/Loading.vue'

export default {
	name: 'SettingsNewAddressbook',
	components: {
		NcInputField,
		IconAdd,
		IconLoading,
	},
	data() {
		return {
			loading: false,
			displayName: '',
		}
	},
	computed: {
		inputErrorState() {
			if (this.displayName === '') {
				return false
			}

			// no slashes!
			return /[/\\]/.test(this.displayName)
		},
	},
	methods: {
		/**
		 * Add a new address book
		 */
		addAddressbook() {
			if (this.displayName === '') {
				return
			}

			this.loading = true
			this.$store.dispatch('appendAddressbook', { displayName: this.displayName })
				.then(() => {
					this.displayName = ''
					this.loading = false
				})
				.catch((error) => {
					console.error(error)
					showError(t('contacts', 'An error occurred, unable to create the address book'))
					this.loading = false
				})
		},
	},
}
</script>
