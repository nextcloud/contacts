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
	<!-- If not in the rfcProps then we don't want to display it -->
	<component :is="componentInstance"
		ref="component"
		:select-type.sync="selectType"
		:prop-model="propModel"
		:value.sync="value"
		:is-first-property="isFirstProperty"
		:property="property"
		:is-last-property="isLastProperty"
		:class="{
			'property--last': isLastProperty,
			[`property-${propName}`]: true
		}"
		:local-contact="localContact"
		:prop-name="propName"
		:prop-type="propType"
		:options="sortedModelOptions"
		:is-read-only="isReadOnly"
		@delete="onDelete"
		@resize="onResize"
		@update="updateContact" />
</template>

<script>
import { Property } from 'ical.js'
import rfcProps from '../../models/rfcProps'
import Contact from '../../models/contact'

import OrgChartsMixin from '../../mixins/OrgChartsMixin'
import PropertyText from '../Properties/PropertyText'
import PropertyMultipleText from '../Properties/PropertyMultipleText'
import PropertyDateTime from '../Properties/PropertyDateTime'
import PropertySelect from '../Properties/PropertySelect'

export default {
	name: 'ContactDetailsProperty',

	mixins: [
		OrgChartsMixin,
	],

	props: {
		property: {
			type: Property,
			default: true,
		},

		/**
		 * Is it the first property of its kind
		 */
		isFirstProperty: {
			type: Boolean,
			default: false,
		},
		/**
		 * Is it the last property of its kind
		 */
		isLastProperty: {
			type: Boolean,
			default: false,
		},

		contact: {
			type: Contact,
			default: null,
		},
		localContact: {
			type: Contact,
			default: null,
		},
		/**
		 * This is needed so that we can update
		 * the contact within the rfcProps actions
		 */
		updateContact: {
			type: Function,
			default: () => {},
		},
		contacts: {
			type: Array,
			default: () => [],
		},
	},

	computed: {
		// dynamically load component based on property type
		componentInstance() {
			// dynamic matching
			if (this.property.isMultiValue && this.propType === 'text') {
				return PropertyMultipleText
			} else if (this.propType && ['date-and-or-time', 'date-time', 'time', 'date'].indexOf(this.propType) > -1) {
				return PropertyDateTime
			} else if (this.propType && this.propType === 'select') {
				return PropertySelect
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
		isReadOnly() {
			if (this.contact.addressbook) {
				return this.contact.addressbook.readOnly
			}
			return false
		},

		/**
		 * Return the type of the prop e.g. FN
		 *
		 * @return {string}
		 */
		propName() {
			// ! is this a ITEMXX.XXX property??
			if (this.propGroup[1]) {
				return this.propGroup[1]
			}

			return this.property.name
		},

		/**
		 * Return the type or property
		 *
		 * @see src/models/rfcProps
		 * @return {string}
		 */
		propType() {
			// if we have a force type set, use it!
			if (this.propModel && this.propModel.force) {
				return this.propModel.force
			}

			return this.property.getDefaultType()
		},

		/**
		 * RFC template matching this property
		 *
		 * @see src/models/rfcProps
		 * @return {object}
		 */
		propModel() {
			return this.properties[this.propName]
		},

		/**
		 * Remove duplicate name amongst options
		 * but make sure to include the selected one
		 * in the final list
		 *
		 * @return {object[]}
		 */
		sortedModelOptions() {
			if (!this.propModel.options) {
				return []
			}

			if (typeof this.propModel.options === 'function') {
				return this.propModel.options({
					contact: this.contact,
					$store: this.$store,
					selectType: this.selectType,
				})
			} else {
				return this.propModel.options.reduce((list, option) => {
					if (!list.find(search => search.name === option.name)) {
						list.push(option)
					}
					return list
				}, this.selectType ? [this.selectType] : [])
			}
		},

		/**
		 * Return the id and type of a property group
		 * e.g ITEMXX.tel => ['ITEMXX', 'tel']
		 *
		 * @return {Array}
		 */
		propGroup() {
			return this.property.name.split('.')
		},

		/**
		 * Return the associated X-ABLABEL if any
		 *
		 * @return {Property}
		 */
		propLabel() {
			return this.localContact.vCard.getFirstProperty(`${this.propGroup[0]}.x-ablabel`)
		},

		/**
		 * Returns the closest match to the selected type
		 * or return the default selected as a new object if
		 * none exists
		 *
		 * @return Object|null
		 */
		selectType: {
			get() {
				// ! if ABLABEL is present, this is a priority
				if (this.propLabel) {
					return {
						id: this.propLabel.name,
						name: this.propLabel.getFirstValue(),
					}
				}
				if (this.propModel && this.propModel.options && this.type) {

					const selectedType = this.type
						// vcard 3.0 save pref alongside TYPE
						.filter(type => type !== 'pref')
						// we only use uppercase strings
						.map(str => str.toUpperCase())

					// Compare array and score them by how many matches they have to the selected type
					// sorting directly is cleaner but slower
					// https://jsperf.com/array-map-and-intersection-perf
					const matchingTypes = this.propModel.options
						.map(type => {
							return {
								type,
								// "WORK,HOME" => ['WORK', 'HOME']
								score: type.id.split(',').filter(value => selectedType.indexOf(value) !== -1).length,
							}
						})

					// Sort by score, filtering out the null score and selecting the first match
					const matchingType = matchingTypes
						.sort((a, b) => b.score - a.score)
						.filter(type => type.score > 0)[0]

					if (matchingType) {
						return matchingType.type
					}
				}
				if (this.type) {
					// vcard 3.0 save pref alongside TYPE
					const selectedType = this.type
						.filter(type => type !== 'pref')
						.join(',')
					if (selectedType.trim() !== '') {
						return {
							id: selectedType,
							name: selectedType,
						}
					}
				}
				return null
			},
			set(data) {
				// if a custom label exists and this is the one we selected
				if (this.propLabel && data.id === this.propLabel.name) {
					this.propLabel.setValue(data.name)
					// only one can coexist
					this.type = []
				} else {
					// ical.js take types as arrays
					this.type = data.id.split(',')
					// only one can coexist
					this.localContact.vCard.removeProperty(`${this.propGroup[0]}.x-ablabel`)

					// checking if there is any other property in this group
					const groups = this.localContact.jCal[1]
						.map(prop => prop[0])
						.filter(name => name.startsWith(`${this.propGroup[0]}.`))
					if (groups.length === 1) {
						// then this prop is the latest of its group
						// -> converting back to simple prop
						// eslint-disable-next-line vue/no-mutating-props
						this.property.jCal[0] = this.propGroup[1]
					}
				}
				this.updateContact()
			},

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
				if (this.propName === 'x-managersname') {
					if (this.property.getParameter('uid')) {
						return this.property.getParameter('uid') + '~' + this.contact.addressbook.id
					}
					// Try to find the matching contact by display name
					// TODO: this only *shows* the display name but doesn't assign the missing UID
					const displayName = this.property.getFirstValue()
					const other = this.otherContacts(this.contact).find(contact => contact.displayName === displayName)
					return other?.key
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
					if (this.propName === 'x-managersname') {
						const manager = this.$store.getters.getContact(data)
						this.property.setValue(manager.displayName)
						this.property.setParameter('uid', manager.uid)
					} else {
						this.property.setValue(data)
					}
				}
				this.updateContact()
			},
		},

		// property meta type
		type: {
			get() {
				const type = this.property.getParameter('type')
				// ensure we have an array
				if (type) {
					return Array.isArray(type) ? type : [type]
				}
				return null
			},
			set(data) {
				this.property.setParameter('type', data)
			},
		},

		// property meta pref
		pref: {
			get() {
				return this.property.getParameter('pref')
			},
			set(data) {
				this.property.setParameter('pref', data)
			},
		},
	},

	methods: {
		/**
		 * Delete this property
		 */
		onDelete() {
			this.localContact.vCard.removeProperty(this.property)
			this.updateContact()
		},

		/**
		 * Forward resize event
		 */
		onResize() {
			this.$emit('resize')
		},
	},
}
</script>
