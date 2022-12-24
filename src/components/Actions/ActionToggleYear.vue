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
	<ActionCheckbox :checked="omitYear"
		@check="removeYear"
		@uncheck="addYear">
		{{ t('contacts', 'Omit year') }}
	</ActionCheckbox>
</template>
<script>
import ActionCheckbox from '@nextcloud/vue/dist/Components/NcActionCheckbox.js'
import ActionsMixin from '../../mixins/ActionsMixin.js'

export default {
	name: 'ActionToggleYear',
	components: {
		ActionCheckbox,
	},
	mixins: [ActionsMixin],
	data() {
		return {
			omitYear: false,
		}
	},

	beforeMount() {
		this.omitYear = !!this.component.property.getFirstParameter('x-apple-omit-year')
				|| !this.component.value.year // if null
	},

	methods: {
		removeYear() {
			const dateObject = this.component.localValue.toJSON()

			// year was already displayed: removing it
			// and use --0124 format
			if (this.component.localContact.version === '4.0') {
				dateObject.year = null
				this.component.updateValue(dateObject)
			} else {
				// --0124 format is only for vcards 4.0
				// using x-apple-omit-year custom parameter
				const year = this.component.value.year
				if (this.component.value.year) {
					this.component.property.setParameter('x-apple-omit-year', parseInt(year).toString())
					this.$nextTick(() => {
						this.component.updateValue(dateObject)
					})
				}
			}
			this.omitYear = !this.omitYear
		},
		addYear() {
			const dateObject = this.component.localValue.toJSON()
			this.component.updateValue(dateObject, true)
			this.omitYear = !this.omitYear
		},
	},
}
</script>
