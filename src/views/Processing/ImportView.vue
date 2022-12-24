<!--
 * @copyright Copyright (c) 2018 Team Popcorn <teampopcornberlin@gmail.com>
 *
 * @author Team Popcorn <teampopcornberlin@gmail.com>
 *
 * @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
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
import Button from '@nextcloud/vue/dist/Components/NcButton.js'
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
				}
			)
		},

		importedHeader() {
			return n('contacts',
				'Done importing %n contact into {addressbook}',
				'Done importing %n contacts into {addressbook}',
				this.total,
				{
					addressbook: this.addressbook,
				}
			)
		},

		importFailed() {
			return n('contacts',
				'{count} error',
				'{count} errors',
				this.failed,
				{ count: this.failed }
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
