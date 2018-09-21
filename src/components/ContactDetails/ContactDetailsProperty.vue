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
	<component v-if="propModel && propType !== 'unknown'" :is="componentInstance" :select-type.sync="selectType"
		:prop-model="propModel" :value.sync="value" :is-first-property="isFirstProperty"
		:property="property" :is-last-property="isLastProperty" :class="{'property--last': isLastProperty}"
		:contact="contact" @delete="deleteProp" />
</template>

<script>
import { Property } from 'ical.js'
import rfcProps from '../../models/rfcProps.js'
import Contact from '../../models/contact'

import PropertyText from '../Properties/PropertyText'
import PropertyMultipleText from '../Properties/PropertyMultipleText'
import PropertyDateTime from '../Properties/PropertyDateTime'
import propertyGroups from '../Properties/PropertyGroups'
// import PropertySelect from '../Properties/PropertyMultipleText'

export default {
	name: 'ContactDetailsProperty',

	props: {
		property: {
			type: Property,
			default: true
		},
		sortedProperties: {
			type: Array,
			default() {
				return []
			}
		},
		index: {
			type: Number,
			default: 0
		},
		contact: {
			type: Contact,
			default: null
		}
	},

	computed: {
		// dynamically load component based on property type
		componentInstance() {
			// groups
			if (this.propName === 'categories') {
				return propertyGroups
			}

			// dynamic matching
			if (this.property.isMultiValue && this.propType === 'text') {
				return PropertyMultipleText
			} else if (this.propType && ['date-and-or-time', 'date-time', 'time', 'date'].indexOf(this.propType) > -1) {
				return PropertyDateTime
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

		// is this the first property of its kind
		isFirstProperty() {
			if (this.index > 0) {
				return this.sortedProperties[this.index - 1].name !== this.propName
			}
			return true
		},
		// is this the last property of its kind
		isLastProperty() {
			// array starts at 0, length starts at 1
			if (this.index < this.sortedProperties.length - 1) {
				return this.sortedProperties[this.index + 1].name !== this.propName
			}
			return true
		},

		// the type of the prop e.g. FN
		propName() {
			return this.property.name
		},
		propType() {
			return this.property.getDefaultType()
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

					// Compare array and score them by how many matches they have to the selected type
					// sorting directly is cleaner but slower
					// https://jsperf.com/array-map-and-intersection-perf
					let matchingTypes = this.propModel.options.map(type => {
						return {
							type,
							// "WORK,HOME" => ['WORK', 'HOME']
							score: type.id.split(',').filter(value => selectedType.indexOf(value) !== -1).length
						}
					})

					// Sort by score, filtering out the null score and selecting the first match
					let matchingType = matchingTypes
						.sort((a, b) => b.score - a.score)
						.filter(type => type.score > 0)[0]

					if (matchingType) {
						return matchingType.type
					}
				}
				if (this.type) {
					// vcard 3.0 save pref alongside TYPE
					let selectedType = this.type.filter(type => type !== 'pref').join(',')
					return {
						id: selectedType,
						name: selectedType
					}
				}
				return false
			},
			set(data) {
				// ical.js take types as arrays
				this.type = data.id.split(',')
				this.$emit('updatedcontact')
			}

		},

		// property value(s)
		value: {
			get() {
				if (this.property.isMultiValue) {
					// differences between values types :x;x;x;x;x and x,x,x,x,x
					return this.property.isStructuredValue
						? this.property.getValues()[0]
						: this.property.getValues()
				}
				return this.property.getFirstValue()
			},
			set(data) {
				if (this.property.isMultiValue) {
					// differences between values types :x;x;x;x;x and x,x,x,x,x
					this.property.isStructuredValue
						? this.property.setValues([data])
						: this.property.setValues(data)
				} else {
					this.property.setValue(data)
				}
				this.$emit('updatedcontact')
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
	},

	methods: {
		/**
		 * Delete this property
		 */
		deleteProp() {
			this.contact.vCard.removeProperty(this.property)
		}
	}

}
</script>
