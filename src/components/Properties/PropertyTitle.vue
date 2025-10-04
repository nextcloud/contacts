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
			{{ displayName }}
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
import {
	NcActionButton as ActionButton,
	NcActions as Actions,
} from '@nextcloud/vue'
import IconPlus from 'vue-material-design-icons/Plus.vue'
import PropertyTitleIcon from './PropertyTitleIcon.vue'
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
			required: true,
		},

		readableName: {
			type: String,
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

	computed: {
		displayName() {
			if (this.property) {
				if (this.property.name === 'bday' || this.property.name === 'deathdate' || this.property.name === 'anniversary') {
					return this.t('contacts', 'Personal dates')
				}
			}

			return this.readableName
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
h3 {
	font-size: 22px;
	margin: 0;
}

.property {
	margin-top: calc(var(--default-grid-baseline) * 3);
	margin-bottom: calc(var(--default-grid-baseline) * 1.5);
	display: flex;
	align-items: center;

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
