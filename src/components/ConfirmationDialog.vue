<template>
	<NcModal class="confirm-modal" @close="cancel">
		<div class="confirm-modal">
			<h2>{{ title }}</h2>
			<slot />
			<div class="confirm-modal__buttons">
				<NcButton type="tertiary" :disabled="disabled" @click="cancel">
					{{ t('contacts', 'Cancel') }}
				</NcButton>
				<NcButton v-if="resolve"
					:disabled="disabled"
					type="primary"
					@click="confirm">
					{{ confirmText }}
				</NcButton>
			</div>
		</div>
	</NcModal>
</template>

<script>
import { NcButton, NcModal } from '@nextcloud/vue'
import { translate as t } from '@nextcloud/l10n'

export default {
	name: 'ConfirmationDialog',
	components: {
		NcButton,
		NcModal,
	},
	props: {
		title: {
			type: String,
			required: true,
		},
		resolve: {
			type: Function,
			required: true,
		},
		reject: {
			type: Function,
			required: true,
		},
		confirmText: {
			type: String,
			default: t('contacts', 'Confirm'),
		},
		disabled: {
			type: Boolean,
			default: undefined,
		},
	},
	methods: {
		confirm() {
			this.resolve()
		},
		cancel() {
			this.reject()
		},
	},
}
</script>

<style lang="scss" scoped>
.confirm-modal {
	padding: 20px;

	&__buttons {
		display: flex;
		justify-content: space-between;
	}
}
</style>
