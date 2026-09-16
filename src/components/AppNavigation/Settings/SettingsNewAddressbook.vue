<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="new-addressbook-entry">
		<NcButton v-if="!hideButton && !modalOpen && !loading" @click="openModal">
			<template #icon>
				<IconAdd :size="20" />
			</template>
			{{ t('contacts', 'New address book') }}
		</NcButton>
		<IconLoading v-if="loading" :size="20" />

		<NcDialog
			v-if="modalOpen"
			size="small"
			:name="t('contacts', 'Add new address book')"
			:buttons="buttons"
			@close="onModalCancel">
			<NcInputField
				v-model:model-value="displayName"
				class="new-addressbook"
				:disabled="loading"
				:label="t('contacts', 'Name of new address book')"
				type="text"
				autocomplete="off"
				autocorrect="off"
				spellcheck="false" />
		</NcDialog>
	</div>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import { NcButton, NcDialog, NcInputField } from '@nextcloud/vue'
import IconLoading from 'vue-material-design-icons/Loading.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import logger from '../../../services/logger.js'

export default {
	name: 'SettingsNewAddressbook',
	components: {
		NcInputField,
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
					disabled: this.loading,
					callback: this.onModalCancel,
					label: t('contacts', 'Cancel'),
				},
				{
					variant: 'primary',
					disabled: this.loading || this.inputErrorState,
					callback: this.onModalSubmit,
					label: t('contacts', 'Add'),
				},
			]
		},

		inputErrorState() {
			if (this.displayName === '') {
				return false
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
			await this.addAddressbook()
			this.modalOpen = false
		},

		/**
		 * Add a new address book
		 */
		async addAddressbook() {
			if (this.displayName === '') {
				return
			}

			this.loading = true

			await this.$store.dispatch('appendAddressbook', { displayName: this.displayName })
				.then(() => {
					this.displayName = ''
				})
				.catch((error) => {
					logger.error(error)
					showError(t('contacts', 'An error occurred, unable to create the address book'))
				})

			this.loading = false
		},
	},
}
</script>
