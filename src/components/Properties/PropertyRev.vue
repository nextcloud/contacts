<!--
  - @copyright Copyright (c) 2019 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Richard Steinmetz <richard@steinmetz.cloud>
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
	<div class="property property--rev">
		<div class="property__row">
			<div class="property__label" />

			<div class="property__value">
				{{ t('contacts', 'Last modified') }} {{ relativeDate }}
			</div>

			<div class="property__actions" />
		</div>
	</div>
</template>

<script>
import moment from '@nextcloud/moment'

export default {
	name: 'PropertyRev',

	props: {
		value: {
			type: Object,
			required: true,
		},
	},

	computed: {
		relativeDate() {
			return moment.unix(this.value.toUnixTime()).fromNow()
		},
	},
}
</script>

<style lang="scss" scoped>
.property {
	&__value {
		opacity: .5;
		color: var(--color-text-lighter);
		line-height: 44px;
	}
}
</style>
