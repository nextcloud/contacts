<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div>
		<ProcessingScreen
			:progress="progress"
			:total="total"
			:desc="failed > 0 ? messageFailed : ''"
			:title="total === progress
				? finishedHeader
				: progressHeader" />
		<div class="close__button">
			<NcButton v-if="total === progress" class="primary" @click="onClose">
				{{ t('contacts', 'Close') }}
			</NcButton>
		</div>
	</div>
</template>

<script>
import { NcButton } from '@nextcloud/vue'
import ProcessingScreen from '../../components/ProcessingScreen.vue'
export default {
	name: 'AddToGroupView',

	components: {
		ProcessingScreen,
		NcButton,
	},

	props: {
		failed: {
			type: Number,
			default: 0,
		},

		progress: {
			type: Number,
			default: 0,
		},

		success: {
			type: Number,
			default: 0,
		},

		total: {
			type: Number,
			default: 0,
		},

		name: {
			type: String,
			default: '',
		},
	},

	computed: {
		progressHeader() {
			return n(
				'contacts',
				'{success} contact added to {name}',
				'{success} contacts added to {name}',
				this.success,
				{ success: this.success, name: this.name },
			)
		},

		finishedHeader() {
			return n(
				'contacts',
				'Adding {success} contact to {name}',
				'Adding {success} contacts to {name}',
				this.success,
				{ success: this.success, name: this.name },
			)
		},

		messageFailed() {
			return n(
				'contacts',
				'{count} error',
				'{count} errors',
				this.failed,
				{ count: this.failed },
			)
		},
	},

	methods: {
		onClose() {
			this.$emit('close')
		},
	},
}
</script>

<style lang="scss" scoped>
.close__button {
	padding: 12px;
	float: inline-end;
}
</style>
