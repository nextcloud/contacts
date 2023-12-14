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
	<div v-if="propModel" class="property property--multiple-text">
		<!-- title if first element -->
		<PropertyTitle v-if="isFirstProperty && propModel.icon"
			:property="property"
			:is-multiple="isMultiple"
			:is-read-only="isReadOnly"
			:bus="bus"
			:icon="propModel.icon"
			:readable-name="propModel.readableName">
			<template #actions>
				<!-- props actions -->
				<PropertyActions v-if="!showActionsInFirstRow && !isReadOnly"
					class="property__actions"
					:actions="actions"
					:property-component="self"
					@delete="deleteProperty" />
			</template>
		</PropertyTitle>

		<div v-if="showActionsInFirstRow" class="property__row">
			<div class="property__label">
				<!-- read-only type because NcMultiselect can't be styled properly -->
				<span v-if="isReadOnly && propModel.options">
					{{ (localType && localType.name) || '' }}
				</span>

				<!-- type selector -->
				<NcSelect v-else-if="!isReadOnly && propModel.options"
					v-model="localType"
					:options="options"
					:placeholder="t('contacts', 'Select type')"
					:taggable="true"
					tag-placeholder="create"
					track-by="id"
					label="name"
					@option:created="createLabel"
					@input="updateType" />

				<!-- if we do not support any type on our model but one is set anyway -->
				<span v-else-if="selectType">
					{{ selectType.name }}
				</span>

				<!-- no options, and showing the first input of an unstructured value?
				then let's put an empty space (or the name again if no title is present) -->
				<span v-else-if="!property.isStructuredValue">
					{{ isFirstProperty ? '' : propModel.readableName }}
				</span>
			</div>

			<div class="property__value">
				<!-- show the first input if not a structured value -->
				<input v-if="!property.isStructuredValue"
					v-model.trim="localValue[0]"
					:readonly="isReadOnly"
					type="text"
					@input="updateValue">
			</div>

			<!-- props actions -->
			<div class="property__actions">
				<PropertyActions v-if="showActionsInFirstRow && !isReadOnly"
					:actions="actions"
					:property-component="this"
					@delete="deleteProperty" />
			</div>
		</div>

		<!-- force order based on model -->
		<template v-if="propModel.displayOrder && propModel.readableValues">
			<div v-for="index in propModel.displayOrder"
				:key="index"
				class="property__row">
				<template v-if="(isReadOnly && localValue[index]) || !isReadOnly">
					<div class="property__label">
						<span>{{ propModel.readableValues[index] }}</span>
					</div>
					<div class="property__value">
						<input v-model.trim="localValue[index]"
							:readonly="isReadOnly"
							type="text"
							@input="updateValue">
					</div>
					<div class="property__actions" />
				</template>
			</div>
		</template>

		<!-- no order enforced: just iterate on all the values -->
		<template v-else>
			<div v-for="(value, index) in filteredValue"
				:key="index"
				class="property__row">
				<template v-if="(isReadOnly && filteredValue[index]) || !isReadOnly">
					<div class="property__label" />
					<div class="property__value">
						<input v-model.trim="filteredValue[index]"
							:readonly="isReadOnly"
							type="text"
							@input="updateValue">
					</div>
					<div class="property__actions" />
				</template>
			</div>
		</template>
	</div>
</template>

<script>
import { NcSelect } from '@nextcloud/vue'
import PropertyMixin from '../../mixins/PropertyMixin.js'
import PropertyTitle from './PropertyTitle.vue'
import PropertyActions from './PropertyActions.vue'

export default {
	name: 'PropertyMultipleText',

	components: {
		NcSelect,
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
		self() {
			// It isn't possible to use "this" in a template slot so it needs to be aliased
			// Ref https://stackoverflow.com/a/69485484
			return this
		},

		filteredValue() {
			return this.localValue.filter((value, index) => index > 0)
		},

		/**
		 * Show the actions menu in the first row (instead of the title).
		 * This is true for all props that either have a type select or a fixed/unknown type.
		 * Otherwise, show the actions menu next to the title to prevent an empty row with just an
		 * actions menu.
		 *
		 * @return {boolean}
		 */
		showActionsInFirstRow() {
			return !!this.propModel.options
				|| !!this.selectType
				|| !this.property.isStructuredValue
		},
	},
}

</script>

<style lang="scss" scoped>
.property {
	&__label {
		&--read-only {
			// Prevent jumping of the label when changing edit/view mode
			// FIXME: drop forced height if NcMultiselect is migrated to NcSelect and can be
			//        properly styled as read-only
			height: 42px;
			line-height: 42px;
		}
	}
}

// Mobile tweaks
@media (max-width: 600px) {
	.property__value {
		width: 125px;
	}
}
</style>
