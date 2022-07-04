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
	<div v-if="propModel" class="property">
		<!-- title if first element -->
		<PropertyTitle v-if="isFirstProperty && propModel.icon"
			:icon="propModel.icon"
			:readable-name="propModel.readableName"
			:has-actions="!isReadOnly" />

		<div class="property__row">
			<!-- type selector -->
			<Multiselect v-if="propModel.options"
				v-model="localType"
				:options="options"
				:placeholder="t('contacts', 'Select type')"
				:taggable="true"
				tag-placeholder="create"
				:disabled="isReadOnly"
				class="property__label"
				track-by="id"
				label="name"
				@tag="createLabel"
				@input="updateType" />

			<!-- if we do not support any type on our model but one is set anyway -->
			<div v-else-if="selectType" class="property__label">
				{{ selectType.name }}
			</div>

			<!-- no options, and showing the first input of an unstructured value?
				then let's put an empty space (or the name again if no title is present) -->
			<div v-else-if="!property.isStructuredValue" class="property__label">
				{{ isFirstProperty ? '' : propModel.readableName }}
			</div>

			<!-- show the first input if not a structured value -->
			<input v-if="!property.isStructuredValue"
				v-model.trim="localValue[0]"
				:readonly="isReadOnly"
				class="property__value"
				type="text"
				@input="updateValue">

			<!-- props actions -->
			<PropertyActions v-if="!isReadOnly"
				class="property__actions--floating"
				:actions="actions"
				:property-component="this"
				@delete="deleteProperty" />
		</div>

		<!-- force order based on model -->
		<template v-if="propModel.displayOrder && propModel.readableValues">
			<div v-for="index in propModel.displayOrder" :key="index" class="property__row">
				<div class="property__label">
					{{ propModel.readableValues[index] }}
				</div>
				<input v-model.trim="localValue[index]"
					:readonly="isReadOnly"
					class="property__value"
					type="text"
					@input="updateValue">
			</div>
		</template>

		<!-- no order enforced: just iterate on all the values -->
		<template v-else>
			<div v-for="(value, index) in filteredValue"
				:key="index"
				class="property__row">
				<div class="property__label" />
				<input v-model.trim="filteredValue[index]"
					:readonly="isReadOnly"
					class="property__value"
					type="text"
					@input="updateValue">
			</div>
		</template>
	</div>
</template>

<script>
import Multiselect from '@nextcloud/vue/dist/Components/Multiselect'
import PropertyMixin from '../../mixins/PropertyMixin'
import PropertyTitle from './PropertyTitle'
import PropertyActions from './PropertyActions'

export default {
	name: 'PropertyMultipleText',

	components: {
		Multiselect,
		PropertyTitle,
		PropertyActions,
	},

	mixins: [PropertyMixin],

	props: {
		value: {
			type: [Array, Object],
			default: () => [],
			required: true,
		},
	},

	computed: {
		filteredValue() {
			return this.localValue.filter((value, index) => index > 0)
		},
	},
}

</script>
<style lang="scss" scoped>
.property__label {
	flex: 1 0;
	width: 60px;
	min-width: 60px !important;
	max-width: 120px;
	height: 34px;
	margin: 3px 5px 3px 0 !important;
	user-select: none;
	text-align: right;
	background-size: 16px;
	line-height: 35px;
}
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
input:not([type='range']) {
	margin: 3px 3px 3px 0;
	padding: 7px 6px;
	font-size: 13px;
	background-color: var(--color-main-background);
	color: var(--color-main-text);
	outline: none;
	border-radius: var(--border-radius);
	cursor: text;
}
.property__value {
	flex: 1 1;
}
::v-deep.property__label.multiselect .multiselect__tags {
	border: none !important;
}

</style>
