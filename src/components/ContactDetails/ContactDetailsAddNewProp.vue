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
	<div class="property property--without-actions property--last">
		<!-- title -->
		<PropertyTitle :icon="'icon-add'" :readable-name="t('contacts', 'Add new property')" />

		<div class="property__row">
			<div class="property__label" />

			<!-- type selector -->
			<Multiselect :options="availableProperties"
				:placeholder="t('contacts', 'Choose property type')"
				class="property__value"
				track-by="id"
				label="name"
				@input="addProp" />
		</div>
	</div>
</template>

<script>
import Multiselect from '@nextcloud/vue/dist/Components/NcMultiselect'
import rfcProps from '../../models/rfcProps'
import Contact from '../../models/contact'
import PropertyTitle from '../Properties/PropertyTitle'
import ICAL from 'ical.js'

export default {
	name: 'ContactDetailsAddNewProp',

	components: {
		Multiselect,
		PropertyTitle,
	},

	props: {
		contact: {
			type: Contact,
			default: null,
		},
	},

	computed: {

		/**
		 * Rfc props
		 *
		 * @return {object}
		 */
		properties() {
			return rfcProps.properties
		},

		/**
		 * List of properties that the contact already have
		 *
		 * @return {string[]}
		 */
		usedProperties() {
			return this.contact.jCal[1].map(prop => prop[0])
		},

		/**
		 * List of every properties you are allowed to add
		 * on this contact
		 *
		 * @return {object[]}
		 */
		availableProperties() {
			return Object.keys(this.properties)
				// only allow to add multiple properties OR props that are not yet in the contact
				.filter(key => this.properties[key].multiple || this.usedProperties.indexOf(key) === -1)
				// usable array of objects
				.map(key => {
					return {
						id: key,
						name: this.properties[key].readableName,
					}
				}).sort((a, b) => a.name.localeCompare(b.name))
		},
	},

	methods: {
		/**
		 * Add a new prop to the contact
		 *
		 * @param {object} data destructuring object
		 * @param {string} data.id the id of the property. e.g fn
		 */
		addProp({ id }) {
			if (this.properties[id] && this.properties[id].defaultjCal
				&& this.properties[id].defaultjCal[this.contact.version]) {
				const defaultjCal = this.properties[id].defaultjCal[this.contact.version]
				const property = new ICAL.Property([id, ...defaultjCal])
				this.contact.vCard.addProperty(property)
			} else {
				const defaultData = this.properties[id].defaultValue
				let defaultValue = defaultData ? defaultData.value : ''
				if (Array.isArray(defaultValue)) {
					defaultValue = [...defaultValue]
				}
				const property = this.contact.vCard.addPropertyWithValue(id, defaultValue)
				if (defaultData && defaultData.type) {
					property.setParameter('type', defaultData.type)
				}
			}
		},
	},
}
</script>
<style lang="scss" scoped>
.property__label:not(.multiselect) {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	opacity: 0.7;
}
.property__row {
	position: relative;
	display: flex;
	align-items: center;
}
</style>
