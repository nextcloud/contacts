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
	<!-- If not in the rfcProps then we don't want to display it -->
	<component v-if="propModel" :is="componentInstance" :select-type="selectType"
		:prop-model="propModel" :value="value" />
</template>

<script>
import { Property } from 'ical.js'
import rfcProps from '../../models/rfcProps.js'
import PropertyText from '../properties/PropertyText'
import PropertyMultipleText from '../properties/PropertyMultipleText'
// import PropertySelect from '../properties/PropertyMultipleText'

export default {
	name: 'ContactDetailsProperty',

	props: {
		property: {
			type: Property,
			default: true
		}
	},

	computed: {
		// dynamically load component based on property type
		componentInstance() {
			if (this.property.isMultiValue && this.propType === 'text') {
				return PropertyMultipleText
			} else if (this.propType && this.propType !== 'unknown') {
				return PropertyText
			}
			return PropertyText
		},

		// rfc properties list
		properties() {
			return rfcProps.properties
		},
		fieldOrder() {
			return rfcProps.fieldOrder
		},

		// the type of the prop e.g. FN
		propName() {
			return this.property.name
		},
		propType() {
			return this.property.type
		},

		// template to use
		propModel() {
			return this.properties[this.propName]
		},

		// select type handler
		selectType: {
			get() {
				if (this.propModel && this.propModel.options && this.type) {

					let selectedType = this.type
						// vcard 3.0 save pref alongside TYPE
						.filter(type => type !== 'pref')
						// we only use uppercase strings
						.map(str => str.toUpperCase())

					// Compare array and check if the number of exact matches
					// equals the array length to find the exact property
					return this.propModel.options.find(option => selectedType.length === option.id.split(',').reduce((matches, type) => {
						matches += selectedType.indexOf(type) > -1 ? 1 : 0
						return matches
					}, 0))
				} else if (this.type) {
					return {
						id: this.type.join(','),
						name: this.type.join(',')
					}
				}
				return false
			},
			set(data) {
				// ical.js take types as arrays
				this.type = data.id.split(',')
			}

		},

		// property value(s)
		value: {
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
		},

		// property meta type
		type: {
			get() {
				let type = this.property.getParameter('type')
				// ensure we have an array
				if (type) {
					return Array.isArray(type) ? type : [type]
				}
			},
			set(data) {
				this.property.setParameter('type', data)
			}
		},

		// property meta pref
		pref: {
			get() {
				return this.property.getParameter('pref')
			},
			set(data) {
				this.property.setParameter('pref', data)
			}
		}
	}

}
</script>
