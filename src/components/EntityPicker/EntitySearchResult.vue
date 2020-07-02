<!--
  - @copyright Copyright (c) 2020 John Molakvoæ <skjnldsv@protonmail.com>
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
-->

<template>
	<UserBubble
		class="entity-picker__bubble"
		:class="{'entity-picker__bubble--selected': isSelected}"
		:display-name="label"
		:margin="6"
		:size="44"
		url="#"
		@click.stop.prevent="onClick">
		<template #title>
			<span class="entity-picker__bubble-checkmark icon-checkmark" />
		</template>
	</UserBubble>
</template>

<script>
import UserBubble from '@nextcloud/vue/dist/Components/UserBubble'

export default {
	name: 'EntitySearchResult',

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
		 * Label of the entity
		 */
		selection: {
			type: Object,
			required: true,
		},
	},

	computed: {
		isSelected() {
			return this.id in this.selection
		},
	},

	methods: {
		/**
		 * Forward click to parent
		 * @param {Event} event the click event
		 */
		onClick(event) {
			this.$emit('click', event)
		},
	},
}

</script>

<style lang="scss" scoped>
.entity-picker__bubble {
	display: flex;
	margin-bottom: 4px;
	.entity-picker__bubble-checkmark {
		display: block;
		opacity: 0;
	}

	&--selected,
	&:hover,
	&:focus {
		.entity-picker__bubble-checkmark {
			opacity: 1;
		}
		::v-deep .user-bubble__content {
			// better visual with light default tint
			background-color: var(--color-primary-light);
		}
	}
}

::v-deep .user-bubble__content {
	// Take full width
	width: 100%;
	// Override default styling
	background: none;
	.user-bubble__secondary {
		// Force show checkmark
		display: inline-flex;
		margin-right: 4px;
		margin-left: auto;
	}
	&, * {
		// the whole row is clickable,let's force the proper cursor
		cursor: pointer;
	}
}

</style>
