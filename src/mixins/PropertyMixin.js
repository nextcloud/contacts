/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import debounce from 'debounce'
import Contact from '../models/contact.js'
import { setPropertyAlias } from '../services/updateDesignSet.js'

export default {
	props: {
		// Default property type. e.g. "WORK,HOME"
		selectType: {
			type: [Object],
			default: () => {},
		},
		// Coming from the rfcProps Model
		propModel: {
			type: Object,
			default: () => {},
			required: true,
		},
		propType: {
			type: String,
			default: 'text',
		},
		// The current property passed as Object
		property: {
			type: Object,
			default: () => {},
			required: true,
		},
		// Allows us to know if we need to
		// add the property header or not
		isFirstProperty: {
			type: Boolean,
			default: true,
		},
		// Allows us to know if we need to
		// add an extra space at the end
		isLastProperty: {
			type: Boolean,
			default: true,
		},
		// Is it read-only?
		isReadOnly: {
			type: Boolean,
			default: false,
		},
		// The available TYPE options from the propModel
		// not used on the PropertySelect
		options: {
			type: Array,
			default: () => [],
		},
		localContact: {
			type: Contact,
			default: null,
		},
	},

	data() {
		return {
			// INIT data when the contact change.
			// This is a simple copy that we can update as
			// many times as we can and debounce-fire the update
			// later
			localValue: this.value,
			localType: this.selectType,
		}
	},

	computed: {
		actions() {
			return this.propModel.actions ? this.propModel.actions : []
		},
		haveAction() {
			return this.actions && this.actions.length > 0
		},
	},

	watch: {
		/**
		 * Since we're updating a local data based on the value prop,
		 * we need to make sure to update the local data on contact change
		 * in case the v-Node is reused.
		 */
		value() {
			this.localValue = this.value
		},
		selectType() {
			this.localType = this.selectType
		},
	},

	methods: {
		/**
		 * Delete the property
		 */
		deleteProperty() {
			this.$emit('delete')
		},

		/**
		 * Debounce and send update event to parent
		 */
		updateValue: debounce(function(e) {
			// https://vuejs.org/v2/guide/components-custom-events.html#sync-Modifier
			this.$emit('update:value', this.localValue)
		}, 500),

		updateType: debounce(function(e) {
			// https://vuejs.org/v2/guide/components-custom-events.html#sync-Modifier
			this.$emit('update:selectType', this.localType)
		}, 500),

		createLabel(label) {
			let propGroup = this.property.name
			if (!this.property.name.startsWith('nextcloud')) {
				propGroup = `nextcloud${this.getNcGroupCount() + 1}.${this.property.name}`
				this.property.jCal[0] = propGroup
			}
			const group = propGroup.split('.')[0]
			const name = propGroup.split('.')[1]

			this.localContact.vCard.addPropertyWithValue(`${group}.x-ablabel`, label)

			// force update the main design sets
			setPropertyAlias(name, propGroup)

			this.$emit('update')
		},

		getNcGroupCount() {
			const props = this.localContact.jCal[1]
				.map(prop => prop[0].split('.')[0]) // itemxxx.adr => itemxxx
				.filter(name => name.startsWith('nextcloud')) // filter nextcloudxxx.adr
				.map(prop => parseInt(prop.split('nextcloud')[1])) // nextcloudxxx => xxx
			return props.length > 0
				? Math.max.apply(null, props) // get max iteration of nextcloud grouped props
				: 0
		},
	},
}
