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
	<div class="property property--title">
		<div class="property__label">
			<PropertyTitleIcon :icon="icon" />
		</div>

		<h3 class="property__value">
			{{ readableName }}
		</h3>

		<div class="property__actions">
			<slot name="actions">
				<Actions v-if="!isReadOnly && isMultiple" class="property__actions">
					<ActionButton @click="onAddProp(property.name)">
						<template #icon>
							<IconPlus :size="20" />
						</template>
						{{ t('contacts', 'Add property of this type') }}
					</ActionButton>
				</Actions>
			</slot>
		</div>
	</div>
</template>

<script>
import PropertyTitleIcon from './PropertyTitleIcon.vue'
import {
	NcActionButton as ActionButton,
	NcActions as Actions,
} from '@nextcloud/vue'
import IconPlus from 'vue-material-design-icons/Plus.vue'
export default {
	name: 'PropertyTitle',
	components: {
		IconPlus,
		Actions,
		ActionButton,
		PropertyTitleIcon,
	},
	props: {
		icon: {
			type: String,
			default: '',
			required: true,
		},
		readableName: {
			type: String,
			default: '',
			required: true,
		},
		isReadOnly: {
			type: Boolean,
			required: true,
		},
		property: {
			type: Object,
			default: () => {},
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
	methods: {
		/**
		 * Add prop of type id
		 *
		 * @param {string} id type of prop
		 */
		onAddProp(id) {
			this.bus.emit('add-prop', id)
		},
	},
}
</script>

<style lang="scss" scoped>
.property {
	// Left align icon and title on mobile
	@media (max-width: 1024px) {
		&__label {
			width: unset;
		}
	}

	&__value {
		font-weight: bold;
	}
}
</style>
