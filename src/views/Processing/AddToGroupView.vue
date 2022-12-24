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
			:desc="failed > 0 ? messageFailed : ''"
			:title="total === progress
				? finishedHeader
				: progressHeader" />
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
	name: 'AddToGroupView',

	components: {
		ProcessingScreen,
		Button,
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
			return n('contacts',
				'{success} contact added to {name}',
				'{success} contacts added to {name}',
				this.success,
				{ success: this.success, name: this.name }
			)
		},

		finishedHeader() {
			return n('contacts',
				'Adding {success} contact to {name}',
				'Adding {success} contacts to {name}',
				this.success,
				{ success: this.success, name: this.name }
			)
		},

		messageFailed() {
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
