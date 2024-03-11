<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Team Popcorn <teampopcornberlin@gmail.com>
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
