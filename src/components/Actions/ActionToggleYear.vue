<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<ActionCheckbox :checked="omitYear"
		@check="removeYear"
		@uncheck="addYear">
		{{ t('contacts', 'Omit year') }}
	</ActionCheckbox>
</template>
<script>
import { NcActionCheckbox as ActionCheckbox } from '@nextcloud/vue'
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
