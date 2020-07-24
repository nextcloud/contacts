<!--
  - @copyright Copyright (c) 2019 Marco Ambrosini <marcoambrosini@pm.me>
  -
  - @author Marco Ambrosini <marcoambrosini@pm.me>
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
	<Modal
		size="full"
		@close="onCancel">
		<!-- Wrapper for content & navigation -->
		<div
			class="entity-picker">
			<!-- Search -->
			<div class="entity-picker__search">
				<div class="entity-picker__search-icon icon-search" />
				<input
					v-model="searchQuery"
					class="entity-picker__search-input"
					type="search"
					:placeholder="t('contacts', 'Search {types}', {types: searchPlaceholderTypes})"
					@change="onSearch">
			</div>

			<!-- Picked entities -->
			<transition-group
				v-if="Object.keys(selection).length > 0"
				name="zoom"
				tag="ul"
				class="entity-picker__selection">
				<EntityBubble
					v-for="entity in selection"
					:key="entity.key || `entity-${entity.type}-${entity.id}`"
					v-bind="entity"
					@delete="onDelete(entity)" />
			</transition-group>

			<!-- TODO: find better wording/icon -->
			<EmptyContent v-if="loading" icon="">
				{{ t('contacts', 'Loading …') }}
			</EmptyContent>

			<!-- Searched & picked entities -->
			<VirtualList v-else-if="searchSet.length > 0 && availableEntities.length > 0"
				class="entity-picker__options"
				data-key="id"
				:data-sources="availableEntities"
				:data-component="EntitySearchResult"
				:estimate-size="44"
				:extra-props="{selection, onClick: onPick}" />

			<EmptyContent v-else-if="searchQuery" icon="icon-search">
				{{ t('contacts', 'No results') }}
			</EmptyContent>

			<div class="entity-picker__navigation">
				<button
					class="navigation__button-left"
					@click="onCancel">
					{{ t('contacts', 'Cancel') }}
				</button>
				<button
					class="navigation__button-right primary"
					@click="onSubmit">
					{{ t('contacts', 'Add to group') }}
				</button>
			</div>
		</div>
	</modal>
</template>

<script>
import Modal from '@nextcloud/vue/dist/Components/Modal'
import EmptyContent from '@nextcloud/vue/dist/Components/EmptyContent'
import VirtualList from 'vue-virtual-scroll-list'

import EntityBubble from './EntityBubble'
import EntitySearchResult from './EntitySearchResult'

export default {
	name: 'EntityPicker',

	components: {
		EmptyContent,
		EntityBubble,
		Modal,
		VirtualList,
	},

	props: {
		loading: {
			type: Boolean,
			default: false,
		},

		/**
		 * The types of data within dataSet
		 * Array of objects. id must match dataSet entity type
		 */
		dataTypes: {
			type: Array,
			required: true,
			validator: types => {
				const invalidTypes = types.filter(type => !type.id && !type.label)
				if (invalidTypes.length > 0) {
					console.error('The following types MUST have a proper id and label key', invalidTypes)
					return false
				}
				return true
			},
		},

		/**
		 * The data to be used
		 */
		dataSet: {
			type: Array,
			required: true,
		},

		/**
		 * The sorting key for the dataSet
		 */
		sort: {
			type: String,
			default: 'label',
		},
	},

	data() {
		return {
			searchQuery: '',
			selection: {},
			EntitySearchResult,
		}
	},

	computed: {
		/**
		 * Are we handling a single entity type ?
		 * @returns {boolean}
		 */
		isSingleType() {
			return !(this.dataTypes.length > 1)
		},

		searchPlaceholderTypes() {
			const types = this.dataTypes
				.map(type => type.label)
				.join(', ')
			return `${types}…`
		},

		/**
		 * Available data based on current search if query
		 * is valid, returns default full data et otherwise
		 * @returns {Object[]}
		 */
		searchSet() {
			if (this.searchQuery && this.searchQuery.trim !== '') {
				return this.dataSet.filter(entity => {
					return entity.label.indexOf(this.searchQuery) > -1
				})
			}
			return this.dataSet
		},

		/**
		 * Returns available entities grouped by type(s) if any
		 * @returns {Array[]}
		 */
		availableEntities() {
			// If only one type, return the full set directly
			if (this.isSingleType) {
				return this.searchSet
			}

			// Else group by types
			return this.dataTypes.map(type => [
				{
					id: type.id,
					label: type.label,
					heading: true,
				},
				...this.searchSet.filter(entity => entity.type === type.id),
			]).flat()
		},
	},

	methods: {
		onCancel() {
			/**
			 * Emitted when the user closed or cancelled
			 */
			this.$emit('close')
		},
		onSubmit() {
			/**
			 * Emitted when user submit the form
			 * @type {Array} the selected entities
			 */
			this.$emit('submit', Object.values(this.selection))
		},

		onSearch(event) {
			/**
			 * Emitted when search change
			 * @type {string} the search query
			 */
			this.$emit('search', this.searchQuery)
		},

		/**
		 * Remove entity from selection
		 * @param {Object} entity the entity to remove
		 */
		onDelete(entity) {
			this.$delete(this.selection, entity.id, entity)
			console.debug('Removing entity from selection', entity)
		},

		/**
		 * Add entity from selection
		 * @param {Object} entity the entity to add
		 */
		onPick(entity) {
			this.$set(this.selection, entity.id, entity)
			console.debug('Added entity to selection', entity)
		},

		/**
		 * Toggle entity from selection
		 * @param {Object} entity the entity to add/remove
		 */
		onToggle(entity) {
			if (entity.id in this.selection) {
				this.onDelete(entity)
			} else {
				this.onPick(entity)
			}
		},
	},

}

</script>

<style lang="scss" scoped>

// Dialog variables
$dialog-margin: 20px;
$dialog-width: 300px;
$dialog-height: 480px;
$entity-spacing: 4px;

// https://uxplanet.org/7-rules-for-mobile-ui-button-design-e9cf2ea54556
// recommended is 48px
// 44px is what we choose and have very good visual-to-usability ratio
$clickable-area: 44px;

// background icon size
// also used for the scss icon font
$icon-size: 16px;

// icon padding for a $clickable-area width and a $icon-size icon
// ( 44px - 16px ) / 2
$icon-margin: ($clickable-area - $icon-size) / 2;

.entity-picker {
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	/** This next 2 rules are pretty hacky, with the modal component somehow
	the margin applied to the content is added to the total modal width,
	so here we subtract it to the width and height of the content.
	*/
	width: $dialog-width - $dialog-margin * 2;
	height: $dialog-height - $dialog-margin * 2;
	margin: $dialog-margin;
	max-height: calc(100vh - $dialog-margin * 2 - 10px);

	&__search {
		position: relative;
		display: flex;
		align-items: center;
		&-input {
			width: 100%;
			height: $clickable-area - $entity-spacing !important;
			padding-left: $clickable-area;
			font-size: 16px;
			line-height: $clickable-area - $entity-spacing;
			margin: $entity-spacing 0;
		}
		&-icon {
			position: absolute;
			width: $clickable-area;
			height: $clickable-area;
		}
	}

	&__selection {
		display: flex;
		overflow-y: auto;
		align-content: flex-start;
		flex: 1 0 auto;
		flex-wrap: wrap;
		// half a line height to know there is more lines
		max-height: 6.5em;
		padding: $entity-spacing 0;
		border-bottom: 1px solid var(--color-background-darker);
		background: var(--color-main-background);
	}

	&__options {
		margin: $entity-spacing 0;
		overflow-y: auto;
	}

	&__navigation {
		z-index: 1;
		display: flex;
		// define our base width, no shrinkage
		flex: 0 0;
		justify-content: space-between;
		// Same as above
		width: $dialog-width - $dialog-margin * 2;
		box-shadow: 0 -10px 5px var(--color-main-background);
		&__button-right {
			margin-left: auto;
		}
	}
}

/** Size full in the modal component doesn't have border radius, this adds
it back */
::v-deep .modal-container {
	border-radius: var(--border-radius-large) !important;
}

</style>

<style lang="scss" scoped>
.zoom-enter-active {
	animation: zoom-in var(--animation-quick);
}

.zoom-leave-active {
	animation: zoom-in var(--animation-quick) reverse;

	will-change: transform;
}

@keyframes zoom-in {
	0% {
		transform: scale(0);
	}
	100% {
		transform: scale(1);
	}
}

</style>
