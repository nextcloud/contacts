<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<UserBubble class="entity-picker__bubble"
		:margin="0"
		:size="22"
		:display-name="label">
		<template #title>
			<a href="#"
				:title="t('contacts', 'Remove {type}', { type })"
				class="entity-picker__bubble-delete icon-close"
				@click="onDelete" />
		</template>
	</UserBubble>
</template>

<script>
import { NcUserBubble as UserBubble } from '@nextcloud/vue'

export default {
	name: 'EntityBubble',

	components: {
		UserBubble,
	},

	props: {
		/**
		 * Unique id of the entity
		 */
		id: {
			type: String,
			required: true,
		},

		/**
		 * Label of the entity
		 */
		label: {
			type: String,
			required: true,
		},

		/**
		 * Type of the entity. e.g user, circle, group...
		 */
		type: {
			type: String,
			required: true,
		},
	},

	methods: {
		onDelete() {
			// Emit delete. Be aware it might be unique
			// amongst their types, but not unique amongst
			// the whole selection all. Make sure to
			// properly compare all necessary data.
			this.$emit('delete', {
				id: this.id,
				type: this.type,
			})
		},
	},
}
</script>

<style lang="scss" scoped>
// better visual with light default tint
:deep(.user-bubble__content) {
	background-color: var(--color-pirimary-light);
}

.entity-picker__bubble {
	display: flex;

	&-delete {
		display: block;
		height: 100%;
		// squeeze in the border radius
		margin-right: -4px;
		opacity: .7;

		&:hover,
		&:active,
		&:focus {
			opacity: 1;
		}
	}
}

</style>
