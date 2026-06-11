/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
			required: true,
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
		isMultiple: {
			type: Boolean,
			default: false,
		},
		bus: {
			type: Object,
			required: false,
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
			const existingGroup = this.property.getParameter('group')

			if (existingGroup) {
				// Server-loaded form: embed group into name, remove group param to avoid double prefix
				propGroup = `${existingGroup}.${this.property.name}`
				this.property.jCal[0] = propGroup
				delete this.property.jCal[1].group // prevent NEXTCLOUD1.NEXTCLOUD1.TEL

				// Remove old X-ABLABEL in server-loaded form (group-param form)
				const oldLabel = this.localContact.vCard
					.getAllProperties('x-ablabel')
					.find((p) => p.getParameter('group') === existingGroup)
				if (oldLabel) { this.localContact.vCard.removeProperty(oldLabel) }
			} else if (!this.property.name.startsWith('nextcloud')) {
				propGroup = `nextcloud${this.getNcGroupCount() + 1}.${this.property.name}`
				this.property.jCal[0] = propGroup
			}
			// else: already has a valid nextcloud group prefix in name — reuse it

			const group = propGroup.split('.')[0]
			const name = propGroup.split('.')[1]

			this.localContact.vCard.addPropertyWithValue(`${group}.x-ablabel`, label.name)
			setPropertyAlias(name, propGroup)
			
			this.$emit('update')
		},

		getNcGroupCount() {
			const props = this.localContact.jCal[1]
				.map((prop) => {
					const nameGroup = prop[0].split('.')[0]
					if (nameGroup.startsWith('nextcloud')) { return nameGroup }
					return (prop[1] && prop[1].group) || ''
				})
				.filter((name) => name.startsWith('nextcloud'))
				.map((prop) => parseInt(prop.replace('nextcloud', '')))
				.filter((n) => !isNaN(n))
			return props.length > 0 ? Math.max.apply(null, props) : 0
		},
	},
}
