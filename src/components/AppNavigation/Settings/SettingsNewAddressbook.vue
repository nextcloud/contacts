<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcButton v-if="!hideButton && !modalOpen" @click="openModal">
		<template #icon>
			<IconAdd :size="20" />
		</template>
		{{ t('contacts', 'New address book') }}
	</NcButton>
	<IconLoading v-if="loading" :size="20" />

	<NcDialog
		v-if="modalOpen"
		:is-form="true"
		size="small"
		:buttons="buttons"
		:name="t('contacts', 'Add new address book')"
		@closing="onModalCancel">
		<NcTextField
			v-model:model-value="displayName"
			:disabled="loading"
			:label="t('contacts', 'Address book name')"
			autocomplete="off"
			autocorrect="off"
			spellcheck="false" />
	</NcDialog>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import { NcButton, NcDialog, NcTextField } from '@nextcloud/vue'
import IconLoading from 'vue-material-design-icons/Loading.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import logger from '../../../services/logger.js'

export default {
	name: 'SettingsNewAddressbook',
	components: {
		NcTextField,
		IconAdd,
		IconLoading,
		NcButton,
		NcDialog,
	},

	props: {
		hideButton: {
			type: Boolean,
			default: false,
		},
	},

	data() {
		return {
			loading: false,
			displayName: '',
			modalOpen: false,
		}
	},

	computed: {
		buttons() {
			return [
				{
					variant: 'tertiary',
					callback: this.onModalCancel,
					label: t('contacts', 'Cancel'),
				},
				{
					variant: 'primary',
					callback: this.onModalSubmit,
					disabled: this.inputErrorState,
					type: 'submit',
					label: t('contacts', 'Add'),
				},
			]
		},

		inputErrorState() {
			if (this.displayName === '') {
				return true
			}

			// no slashes!
			return /[/\\]/.test(this.displayName)
		},
	},

	methods: {
		openModal() {
			this.modalOpen = true
		},

		onModalCancel() {
			this.modalOpen = false
			this.displayName = ''
			this.loading = false
		},

		async onModalSubmit() {
			return this.addAddressbook()
		},

		/**
		 * Add a new address book
		 */
		addAddressbook() {
			if (this.displayName === '') {
				return false
			}

			this.loading = true
			return this.$store.dispatch('appendAddressbook', { displayName: this.displayName })
				.then(() => {
					this.displayName = ''
					this.loading = false
					this.modalOpen = false
					return true
				})
				.catch((error) => {
					this.loading = false
					logger.error(error)
					showError(t('contacts', 'An error occurred, unable to create the address book'))
					return false
				})
		},
	},
}
</script>
