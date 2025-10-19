<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="new-addressbook-entry">
		<NcButton v-if="!modalOpen && !loading" @click="openModal">
			<template #icon>
				<IconAdd :size="20" />
			</template>
			{{ t('contacts', 'New address book') }}
		</NcButton>
		<IconLoading v-if="loading" :size="20" />

		<NcModal v-if="modalOpen" @close="onModalCancel" size="small">
			<div class="new-addressbook-modal">
				<NcInputField
					v-model:model-value="displayName"
					class="new-addressbook"
					:disabled="loading"
					:label="t('contacts', 'Add new address book')"
					type="text"
					autocomplete="off"
					autocorrect="off"
					spellcheck="false" />

				<div class="new-addressbook-modal__buttons">
					<NcButton variant="tertiary" :disabled="loading" @click="onModalCancel">
						{{ t('contacts', 'Cancel') }}
					</NcButton>
					<NcButton variant="primary" :disabled="loading || inputErrorState" @click="onModalSubmit">
						{{ t('contacts', 'Add') }}
					</NcButton>
				</div>
			</div>
		</NcModal>
	</div>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import { NcButton, NcInputField, NcModal } from '@nextcloud/vue'
import IconLoading from 'vue-material-design-icons/Loading.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'

export default {
	name: 'SettingsNewAddressbook',
	components: {
		NcInputField,
		IconAdd,
		IconLoading,
		NcButton,
		NcModal,
	},

	data() {
		return {
			loading: false,
			displayName: '',
			modalOpen: false,
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

<style lang="scss" scoped>

.new-addressbook-entry {
	display: flex;
	width: 100%;
	justify-content: stretch;
	margin-top: calc(var(--default-grid-baseline) * 2);

	> * {
		flex-grow: 1;
	}
}

.new-addressbook-modal {
	padding: calc(var(--default-grid-baseline) * 4);
	padding-top: calc(var(--default-grid-baseline) * 8);
	> * {
		width: 100%;
	}

	&__buttons {
		display: flex;
		justify-content: end;
		gap: calc(var(--default-grid-baseline) * 2);
		margin-top: calc(var(--default-grid-baseline) * 2);
	}
}
</style>
