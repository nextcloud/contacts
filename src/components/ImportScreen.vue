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
	<div v-if="importState.stage != 'default'" class="emptycontent import-screen">
		<p class="icon-upload" />
		<h3 class="import-screen__header">{{ t('contacts', 'Importing into') }} {{ addressbook }}</h3>
		<progress :max="importState.total" :value="importState.accepted" class="import-screen__progress" />
		<p class="import-screen__tracker">{{ Math.floor(importState.accepted/(importState.total + 1)) * 100 }} %</p>
	</div>
</template>

<script>

export default {
	name: 'ImportScreen',
	computed: {
		importState() {
			return this.$store.getters.getImportState
		}
	}
}
</script>
