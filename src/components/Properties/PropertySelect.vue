<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Richard Steinmetz <richard@steinmetz.cloud>
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
	<div v-if="propModel" class="property">
		<!-- title if first element -->
		<PropertyTitle v-if="isFirstProperty && propModel.icon"
			:property="property"
			:is-multiple="isMultiple"
			:bus="bus"
			:icon="propModel.icon"
			:readable-name="propModel.readableName" />

		<div class="property__row"
			:class="{'property__row--without-actions': isReadOnly || hideActions}">
			<!-- if we do not support any type on our model but one is set anyway -->
			<div v-if="selectType" class="property__label">
				{{ selectType.name }}
			</div>

			<!-- no options, empty space -->
			<div v-else class="property__label">
				{{ propModel.readableName }}
			</div>

			<Multiselect v-model="matchedOptions"
				:options="options"
				:placeholder="t('contacts', 'Select option')"
				:disabled="isSingleOption || isReadOnly"
				class="property__value"
				track-by="id"
				label="name"
				@input="updateValue" />

			<!-- props actions -->
			<PropertyActions v-if="!isReadOnly && !hideActions"
				:actions="actions"
				:property-component="this"
				@delete="deleteProperty" />
		</div>
	</div>
</template>

<script>
import Multiselect from '@nextcloud/vue/dist/Components/NcMultiselect.js'
import PropertyMixin from '../../mixins/PropertyMixin.js'
import PropertyTitle from './PropertyTitle.vue'
import PropertyActions from './PropertyActions.vue'

export default {
	name: 'PropertySelect',

	components: {
		Multiselect,
		PropertyTitle,
		PropertyActions,
	},

	mixins: [PropertyMixin],

	props: {
		value: {
			type: [Object, String, Array],
			default: '',
			required: true,
		},
		hideActions: {
			type: Boolean,
			default: false,
		},
	},

	computed: {
		// is there only one option available
		isSingleOption() {
			return this.propModel.options.length <= 1 && this.options.length <= 1
		},

		// matching value to the options we provide
		matchedOptions: {
			get() {
				const options = this.options || this.propModel.options
				// match lowercase as well
				let selected = options.find(option => option.id === this.localValue
					|| option.id === this.localValue.toLowerCase())

				// if the model provided a custom match fallback, use it
				if (!selected && this.propModel.greedyMatch) {
					selected = this.propModel.greedyMatch(this.localValue, options)
				}

				// properly display array as a string
				if (Array.isArray(this.localValue)) {
					return selected || {
						id: this.localValue.join(';'),
						name: this.localValue.join(';'),
					}
				}
				return selected || {
					id: this.localValue,
					name: this.localValue,
				}
			},
			set(value) {
				// only keeping the array if the original value was one
				if (Array.isArray(this.localValue)) {
					this.localValue = value.id.split(';')
				} else {
					this.localValue = value.id
				}
			},
		},
	},
}
</script>
