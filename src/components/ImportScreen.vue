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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<div class="emptycontent import-screen">
		<p class="icon-upload" />
		<h3 class="import-screen__header">{{ t('contacts', 'Importing {total} contacts into', { total }) }} {{ addressbook }}</h3>
		<progress :max="total" :value="progress" class="import-screen__progress" />
		<p class="import-screen__tracker">
			<span>{{ percentage }} %</span>
			<span v-tooltip.auto="t('contacts', 'Open your browser console for more details')">{{ denied }} {{ t('contacts', 'failed') }}</span>
		</p>
	</div>
</template>

<script>
import Vue from 'vue'
import VTooltip from 'v-tooltip'

Vue.use(VTooltip)

export default {
	name: 'ImportScreen',
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
		denied() {
			return this.importState.denied
		},
		progress() {
			return this.accepted + this.denied
		},
		percentage() {
			return this.total <= 0
				? 0
				: Math.floor(this.progress / this.total * 100)
		}
	}
}
</script>
