<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @license GNU AGPL version 3 or any later version
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
	<h3 class="property__title property__row">
		<div :class="icon" class="property__label property__title--icon" />
		<span class="property__value property__title--right">
			<div>{{ readableName }}</div>
			<!-- display tooltip with hint if available -->
			<div v-if="info" v-tooltip.auto="info" class="property__title--icon-details icon-details" />
		</span>
	</h3>
</template>

<script>
export default {
	name: 'PropertyTitle',

	props: {
		icon: {
			type: String,
			default: '',
			required: true
		},
		readableName: {
			type: String,
			default: '',
			required: true
		},
		info: {
			type: String,
			default: '',
			required: false
		}
	}
}
</script>
