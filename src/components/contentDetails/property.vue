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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<input v-model="prop" type="text">
</template>

<script>
import { Property } from 'ical.js'

export default {
	name: 'Property',
	props: {
		property: {
			type: Property,
			default: true
		}
	},
	computed: {
		prop: {
			get() {
				if (this.property.isMultiValue) {
					return this.property.getValues()
				}
				return this.property.getFirstValue()
			},
			set(data) {
				if (this.property.isMultiValue) {
					return this.property.setValues(data)
				}
				return this.property.setValue(data)
			}
		}
	}

}
</script>
