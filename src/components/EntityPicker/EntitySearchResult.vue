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
	<h4 v-if="source.heading" :key="source.id" class="entity-picker__option-caption">
		{{ t('contacts', 'Add {type}', {type: source.label.toLowerCase()}) }}
	</h4>

	<UserBubble v-else
		class="entity-picker__bubble"
		:class="{'entity-picker__bubble--selected': isSelected}"
		:display-name="source.label"
		:user="source.user"
		:margin="6"
		:size="44"
		url="#"
		@click.stop.prevent="onClick(source)">
		<template #title>
			<span class="entity-picker__bubble-checkmark icon-checkmark" />
		</template>
	</UserBubble>
</template>

<script>
import UserBubble from '@nextcloud/vue/dist/Components/NcUserBubble.js'

export default {
	name: 'EntitySearchResult',

	components: {
		UserBubble,
	},

	props: {
		source: {
			type: Object,
			default() {
				return {}
			},
		},
		onClick: {
			type: Function,
			default() {},
		},
		selection: {
			type: Object,
			default: () => ({}),
		},
	},

	computed: {
		isSelected() {
			return this.source.id in this.selection
		},
	},
}

</script>

<style lang="scss" scoped>
@use "sass:math";

// https://uxplanet.org/7-rules-for-mobile-ui-button-design-e9cf2ea54556
// recommended is 48px
// 44px is what we choose and have very good visual-to-usability ratio
$clickable-area: 44px;

// background icon size
// also used for the scss icon font
$icon-size: 16px;

// icon padding for a $clickable-area width and a $icon-size icon
// ( 44px - 16px ) / 2
$icon-margin: math.div($clickable-area - $icon-size, 2);

.entity-picker {
	&__option {
		&-caption {
			padding-left: 10px;
			list-style-type: none;
			user-select: none;
			white-space: nowrap;
			text-overflow: ellipsis;
			pointer-events: none;
			color: var(--color-primary);
			box-shadow: none !important;
			line-height: $clickable-area;

			&:not(:first-child) {
				margin-top: math.div($clickable-area, 2);
			}
		}
	}

	&__bubble {
		display: flex;
		margin-bottom: 4px;

		&-checkmark {
			display: block;
			opacity: 0;
		}

		// Show checkmark on selected
		&--selected .entity-picker__bubble-checkmark {
			opacity: 1;
		}

		// Show primary bg on hovering entities
		&--selected,
		&:hover,
		&:focus {
			::v-deep .user-bubble__content {
				// better visual with light default tint
				background-color: var(--color-primary-light);
			}
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
		user-select: none;
		-webkit-user-drag: none;
		-khtml-user-drag: none;
		-moz-user-drag: none;
		-o-user-drag: none;
	}
}

</style>
