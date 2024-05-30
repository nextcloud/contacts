<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
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
