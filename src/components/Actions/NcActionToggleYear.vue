<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcActionCheckbox
		:model-value="omitYear"
		@update:model-value="onUpdate">
		{{ t('contacts', 'Omit year') }}
	</NcActionCheckbox>
</template>

<script>
import { NcActionCheckbox } from '@nextcloud/vue'
import ActionsMixin from '../../mixins/ActionsMixin.js'

export default {
	// Name needs to start with NcAction!
	// Otherwise, it won't be rendered inside an NcActions menu.
	name: 'NcActionToggleYear',

	components: {
		NcActionCheckbox,
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
		onUpdate(omitYear) {
			if (omitYear) {
				this.removeYear()
			} else {
				this.addYear()
			}

			this.omitYear = omitYear
		},

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
		},

		addYear() {
			const dateObject = this.component.localValue.toJSON()
			this.component.updateValue(dateObject, true)
		},
	},
}
</script>
