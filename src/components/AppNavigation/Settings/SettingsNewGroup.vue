<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcButton v-if="!hideButton && !modalOpen && !loading" @click="openModal">
		<template #icon>
			<IconAdd :size="20" />
		</template>
		{{ t('contacts', 'New contact group') }}
	</NcButton>
	<IconLoading v-if="loading" :size="20" />

	<NcDialog
		v-if="modalOpen"
		:is-form="true"
		size="small"
		:buttons="buttons"
		:name="t('contacts', 'Add new contact group')"
		@closing="onModalCancel">
		<NcTextField
			v-model:model-value="displayName"
			:disabled="loading"
			:label="t('contacts', 'Contact group name')"
			autocomplete="off"
			autocorrect="off"
			spellcheck="false" />
	</NcDialog>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import { emit } from '@nextcloud/event-bus'
import { NcButton, NcDialog, NcTextField } from '@nextcloud/vue'
import IconLoading from 'vue-material-design-icons/Loading.vue'
import IconAdd from 'vue-material-design-icons/Plus.vue'
import logger from '../../../services/logger.js'

export default {
	name: 'SettingsNewGroup',
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

		groups() {
			return this.$store.getters.getGroups
		},

		inputErrorState() {
			return this.displayName === ''
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
			const groupName = this.displayName

			if (this.groups.find((group) => group.name === groupName)) {
				showError(t('contacts', 'This group already exists'))
				return false
			}

			this.loading = true

			try {
				emit('contacts:group:append', groupName)
			} catch (error) {
				showError(t('contacts', 'An error occurred while creating the group'))
			}

			this.displayName = ''
			this.loading = false
			this.modalOpen = false
			return true
		},
	},
}
</script>
