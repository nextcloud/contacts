<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div>
		<ProcessingScreen :progress="progress"
			:total="total"
			:desc="failed > 0 ? importFailed : ''"
			:title="total === progress
				? importedHeader
				: importingHeader" />
		<div class="close__button">
			<Button v-if="total === progress" class="primary" @click="onClose">
				{{ t('contacts', 'Close') }}
			</Button>
		</div>
	</div>
</template>

<script>
import ProcessingScreen from '../../components/ProcessingScreen.vue'
import { NcButton as Button } from '@nextcloud/vue'
export default {
	name: 'ImportView',

	components: {
		ProcessingScreen,
		Button,
	},

	computed: {
		importState() {
			return this.$store.getters.getImportState
		},
		addressbook() {
			return this.importState.addressbook
		},
		total() {
			return this.importState.total
		},
		accepted() {
			return this.importState.accepted
		},
		failed() {
			return this.importState.denied
		},
		progress() {
			return this.accepted + this.failed
		},

		importingHeader() {
			return n('contacts',
				'Importing %n contact into {addressbook}',
				'Importing %n contacts into {addressbook}',
				this.total,
				{
					addressbook: this.addressbook,
				},
			)
		},

		importedHeader() {
			return n('contacts',
				'Done importing %n contact into {addressbook}',
				'Done importing %n contacts into {addressbook}',
				this.total,
				{
					addressbook: this.addressbook,
				},
			)
		},

		importFailed() {
			return n('contacts',
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
	float: right;
}
</style>
