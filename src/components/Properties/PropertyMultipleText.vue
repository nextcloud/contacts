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
	<div v-if="propModel" :class="`grid-span-${gridLength}`" class="property">
		<!-- title if first element -->
		<property-title v-if="isFirstProperty && propModel.icon" :icon="propModel.icon" :readable-name="propModel.readableName"
			:info="propModel.info" />

		<div class="property__row">
			<!-- type selector -->
			<multiselect v-if="propModel.options" v-model="localType"
				:options="options" :searchable="false" :placeholder="t('contacts', 'Select type')"
				:disabled="isReadOnly" class="property__label" track-by="id"
				label="name" @input="updateType" />

			<!-- if we do not support any type on our model but one is set anyway -->
			<div v-else-if="selectType" class="property__label">{{ selectType.name }}</div>

			<!-- no options, empty space -->
			<div v-else class="property__label">{{ propModel.readableName }}</div>

			<!-- show the first input if not -->
			<input v-if="!property.isStructuredValue" v-model.trim="localValue[0]" :readonly="isReadOnly"
				class="property__value" type="text" @input="updateValue">

			<!-- delete the prop -->
			<button v-if="!isReadOnly" :title="t('contacts', 'Delete')" class="property__delete icon-delete"
				@click="deleteProperty" />
		</div>

		<!-- force order based on model -->
		<template v-if="propModel.displayOrder && propModel.readableValues">
			<div v-for="index in propModel.displayOrder" :key="index" class="property__row">
				<div class="property__label">{{ propModel.readableValues[index] }}</div>
				<input v-model.trim="localValue[index]" :readonly="isReadOnly" class="property__value"
					type="text" @input="updateValue">
			</div>
		</template>

		<!-- no order enforced: just iterate on all the values -->
		<template v-else>
			<div v-for="(value, index) in localValue" v-if="index > 0" :key="index"
				class="property__row">
				<div class="property__label" />
				<input v-model.trim="localValue[index]" :readonly="isReadOnly" class="property__value"
					type="text" @input="updateValue">
			</div>
		</template>
	</div>
</template>

<script>
import PropertyMixin from 'Mixins/PropertyMixin'
import PropertyTitle from './PropertyTitle'

export default {
	name: 'PropertyText',

	components: {
		PropertyTitle
	},

	mixins: [PropertyMixin],

	props: {
		value: {
			type: [Array, Object],
			default: () => [],
			required: true
		}
	},

	computed: {
		gridLength() {
			let hasTitle = this.isFirstProperty && this.propModel.icon ? 1 : 0
			let isLast = this.isLastProperty
			let hasValueNames = this.propModel.readableValues ? 1 : 0
			let length = this.propModel.displayOrder ? this.propModel.displayOrder.length : this.value.length
			return hasValueNames + hasTitle + length + isLast
		}
	}
}

</script>
