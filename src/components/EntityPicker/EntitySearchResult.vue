<!--
  - SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
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
import { NcUserBubble as UserBubble } from '@nextcloud/vue'

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
@use 'sass:math';

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
			list-style-type: none;
			user-select: none;
			white-space: nowrap;
			text-overflow: ellipsis;
			pointer-events: none;
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
			:deep(.user-bubble__content) {
				// better visual with light default tint
				background-color: var(--color-primary-element-light);
			}
		}
	}
}

:deep(.user-bubble__content){
	// Take full width
	width: 100%;
	// Override default styling
	background: none;
	.user-bubble__secondary {
		// Force show checkmark
		display: inline-flex;
		margin-inline: auto 4px;
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
