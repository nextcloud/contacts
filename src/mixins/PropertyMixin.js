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

export default {
	props: {
		// Default property type. e.g. "WORK,HOME"
		selectType: {
			type: [Object],
			default: () => {}
		},
		// Coming fro the rfcProps Model
		propModel: {
			type: Object,
			default: () => {},
			required: true
		},
		// The current property passed as Object
		property: {
			type: Object,
			default: () => {},
			required: true
		},
		// Allows us to know if we need to
		// add the property header or not
		isFirstProperty: {
			type: Boolean,
			default: true
		},
		// Allows us to know if we need to
		// add an extra space at the end
		isLastProperty: {
			type: Boolean,
			default: true
		},
		// Is it read-only?
		isReadOnly: {
			type: Boolean,
			default: false
		},
		// The available TYPE options from the propModel
		// not used on the PropertySelect
		options: {
			type: Array,
			default: () => []
		}
	},

	data() {
		return {
			// INIT data when the contact change.
			// This is a simple copy that we can update as
			// many times as we can and debounce-fire the update
			// later
			localValue: this.value,
			localType: this.selectType
		}
	},

	computed: {
		actions() {
			const del = {
				text: t('contacts', 'Delete'),
				icon: 'icon-delete',
				action: this.deleteProperty
			}
			return [del, ...this.propModel.actions ? this.propModel.actions : []]
		}
	},

	watch: {
		/**
		 * Since we're updating a local data based on the value prop,
		 * we need to make sure to update the local data on pop change
		 */
		value: function() {
			this.localValue = this.value
		},
		selectType: function() {
			this.localType = this.selectType
		}
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
		}, 500)
	}
}
