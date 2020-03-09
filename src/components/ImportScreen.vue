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
	<div class="emptycontent import-screen">
		<p class="icon-upload" />
		<h3 v-if="stage === 'done'" class="import-screen__header">
			{{ importedHeader }}
		</h3>
		<h3 v-else class="import-screen__header">
			{{ importingHeader }}
		</h3>
		<progress :max="total" :value="progress" class="import-screen__progress" />
		<p class="import-screen__tracker">
			<span>{{ percentage }} %</span>
			<span v-if="failed === 0">
				{{ t('contacts', 'No errors') }}
			</span>
			<span v-else v-tooltip.auto="t('contacts', 'Open your browser console for more details')">
				{{ n('contacts',
					'{failedCount} faulty contact',
					'{failedCount} faulty contacts',
					failed,
					{ failedCount: failed }
				) }}
			</span>
		</p>
	</div>
</template>

<script>
export default {
	name: 'ImportScreen',
	computed: {
		importState() {
			return this.$store.getters.getImportState
		},
		addressbook() {
			return this.importState.addressbook
		},
		stage() {
			return this.importState.stage
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
		percentage() {
			return this.total <= 0
				? 0
				: Math.floor(this.progress / this.total * 100)
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
	},
}
</script>
