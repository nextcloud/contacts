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
	<ActionButton :icon="icon" @click="toggleYear">
		{{ omitYear ? t('contacts', 'Add year') : t('contacts', 'Omit year') }}
	</ActionButton>
</template>
<script>
import { ActionButton } from 'nextcloud-vue'
import ActionsMixin from 'Mixins/ActionsMixin'

export default {
	name: 'ActionToggleYear',
	components: {
		ActionButton
	},
	mixins: [ActionsMixin],
	data() {
		return {
			omitYear: false
		}
	},

	computed: {
		icon() {
			return this.omitYear
				? 'icon-calendar-dark'
				: 'icon-no-calendar'
		},
		text() {
			return this.omitYear
				? t('contacts', 'Add year')
				: t('contacts', 'Omit year')
		}
	},

	beforeMount() {
		this.omitYear = !!this.component.property.getFirstParameter('x-apple-omit-year')
				|| !this.component.value.year // if null
	},

	methods: {
		toggleYear() {
			const dateObject = this.component.localValue.toJSON()

			// year was already ignored: adding it back
			if (this.omitYear) {
				this.$nextTick(() => {
					this.component.updateValue(dateObject, true)
				})

			} else if (this.component.localContact.version === '4.0') {
				// year was already displayed: removing it
				// and use --0124 format
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
		}
	}
}
</script>
