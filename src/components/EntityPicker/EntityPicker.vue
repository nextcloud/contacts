<!--
  - SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<Modal size="normal"
		@close="onCancel">
		<!-- Wrapper for content & navigation -->
		<div class="entity-picker">
			<!-- Search -->
			<div class="entity-picker__search">
				<div class="entity-picker__search-icon icon-search" />
				<input ref="input"
					v-model="searchQuery"
					:placeholder="t('contacts', 'Search {types}', {types: searchPlaceholderTypes})"
					class="entity-picker__search-input"
					type="search"
					@input="onSearch">
			</div>

			<!-- Loading -->
			<EmptyContent v-if="loading" :name="t('contacts', 'Loading …')">
				<template #icon>
					<IconLoading :size="20" />
				</template>
			</EmptyContent>

			<template v-else>
				<!-- Picked entities -->
				<transition-group v-if="Object.keys(selectionSet).length > 0"
					name="zoom"
					tag="ul"
					class="entity-picker__selection">
					<EntityBubble v-for="entity in selectionSet"
						:key="entity.key || `entity-${entity.type}-${entity.id}`"
						v-bind="entity"
						@delete="onDelete(entity)" />
				</transition-group>

				<!-- No recommendations -->
				<EmptyContent v-if="dataSet.length === 0"
					:name="t('contacts', 'Search for people to add')"
					:description="emptyDataSetDescription">
					<template #icon>
						<IconSearch :size="20" />
					</template>
				</EmptyContent>

				<!-- Searched & picked entities -->
				<VirtualList v-else-if="searchSet.length > 0 && availableEntities.length > 0"
					class="entity-picker__options"
					data-key="id"
					:data-sources="availableEntities"
					:data-component="EntitySearchResult"
					:estimate-size="44"
					:extra-props="{ selection: selectionSet, onClick }" />

				<EmptyContent v-else-if="searchQuery" :name="t('contacts', 'No results')">
					<template #icon>
						<IconSearch :size="20" />
					</template>
				</EmptyContent>

				<div class="entity-picker__navigation">
					<button :disabled="loading"
						class="navigation__button-left"
						@click="onCancel">
						{{ t('contacts', 'Cancel') }}
					</button>
					<button :disabled="isEmptySelection || loading"
						class="navigation__button-right primary"
						@click="onSubmit">
						{{ confirmLabel }}
					</button>
				</div>
			</template>
		</div>
	</modal>
</template>

<script>
import debounce from 'debounce'
import VirtualList from 'vue-virtual-scroll-list'
import {
	NcEmptyContent as EmptyContent,
	NcLoadingIcon as IconLoading,
	NcModal as Modal,
} from '@nextcloud/vue'
import IconSearch from 'vue-material-design-icons/Magnify.vue'
import EntityBubble from './EntityBubble.vue'
import EntitySearchResult from './EntitySearchResult.vue'

export default {
	name: 'EntityPicker',

	components: {
		EmptyContent,
		EntityBubble,
		IconSearch,
		IconLoading,
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
			validator: data => {
				data.forEach(source => {
					if (!source.id || !source.label) {
						console.error('The following source MUST have a proper id and label key', source)
					}
				})
				return true
			},
		},

		/**
		 * The sorting key for the dataSet
		 */
		sort: {
			type: String,
			default: 'label',
		},

		/**
		 * Confirm button text
		 */
		confirmLabel: {
			type: String,
			default: t('contacts', 'Add to group'),
		},

		/**
		 * The input will also filter the dataSet based on the label.
		 * If you are using the search event to inject a different dataSet, you can disable this
		 */
		internalSearch: {
			type: Boolean,
			default: true,
		},

		/**
		 * Override the local management of selection
		 * You MUST use a sync modifier or the selection will be locked
		 */
		selection: {
			type: Object,
			default: null,
		},

		emptyDataSetDescription: {
			type: String,
			default: '',
		},
	},

	data() {
		return {
			searchQuery: '',
			localSelection: {},
			EntitySearchResult,
		}
	},

	computed: {
		/**
		 * If the selection is set externally, let's use it
		 */
		selectionSet: {
			get() {
				if (this.selection !== null) {
					return this.selection
				}
				return this.localSelection
			},
			set(selection) {
				if (this.selection !== null) {
					this.$emit('update:selection', selection)
				}
				this.localSelection = selection
			},
		},

		/**
		 * Are we handling a single entity type ?
		 *
		 * @return {boolean}
		 */
		isSingleType() {
			return !(this.dataTypes.length > 1)
		},

		/**
		 * Is the current selection empty
		 *
		 * @return {boolean}
		 */
		isEmptySelection() {
			return Object.keys(this.selectionSet).length === 0
		},

		/**
		 * Formatted search input placeholder based on
		 * available types
		 *
		 * @return {string}
		 */
		searchPlaceholderTypes() {
			const types = this.dataTypes
				.map(type => type.label)
				.join(', ')
			return `${types}…`
		},

		/**
		 * Available data based on current search if query
		 * is valid, returns default full data et otherwise
		 *
		 * @return {object[]}
		 */
		searchSet() {
			// If internal search is enabled and we have a search query, filter data set
			if (this.internalSearch && this.searchQuery && this.searchQuery.trim !== '') {
				return this.dataSet.filter(entity => {
					return entity.label.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1
				})
			}
			return this.dataSet
		},

		/**
		 * Returns available entities grouped by type(s) if any
		 *
		 * @return {object[]}
		 */
		availableEntities() {
			// If only one type, return the full set directly
			if (this.isSingleType) {
				return this.searchSet
			}

			// Else group by types
			return this.dataTypes.map(type => {
				const dataSet = this.searchSet.filter(entity => entity.type === type.id)
				const dataList = [
					{
						id: type.id,
						label: type.label,
						heading: true,
					},
					...dataSet,
				]

				// If no results, hide the type
				if (dataSet.length === 0) {
					return []
				}

				return dataList
			}).flat()
		},
	},

	mounted() {
		this.$nextTick(() => {
			this.$refs.input.focus()
			this.$refs.input.select()
		})
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
			 *
			 * @type {Array} the selected entities
			 */
			this.$emit('submit', Object.values(this.selectionSet))
		},

		onSearch: debounce(function() {
			/**
			 * Emitted when search change
			 *
			 * @type {string} the search query
			 */
			this.$emit('search', this.searchQuery)
		}, 200),

		/**
		 * Remove entity from selection
		 *
		 * @param {object} entity the entity to remove
		 */
		onDelete(entity) {
			this.$delete(this.selectionSet, entity.id, entity)
			console.debug('Removing entity from selection', entity)
		},

		/**
		 * Add/remove entity from selection
		 *
		 * @param {object} entity the entity to add
		 */
		onClick(entity) {
			if (entity.id in this.selectionSet) {
				this.$delete(this.selectionSet, entity.id)
				console.debug('Removed entity to selection', entity)
				return
			}

			this.$set(this.selectionSet, entity.id, entity)
			console.debug('Added entity to selection', entity)
		},

		/**
		 * Toggle entity from selection
		 *
		 * @param {object} entity the entity to add/remove
		 */
		onToggle(entity) {
			if (entity.id in this.selectionSet) {
				this.onDelete(entity)
			} else {
				this.onPick(entity)
			}
		},
	},

}

</script>

<style lang="scss" scoped>
@use 'sass:math';

// Dialog variables
$dialog-padding: 20px;
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
$icon-margin: math.div($clickable-area - $icon-size, 2);

.entity-picker {
	position: relative;
	display: flex;
	flex-direction: column;
	min-height: $dialog-height;
	height: 100%;
	padding: $dialog-padding;
	box-sizing: border-box;

	&__search {
		position: relative;
		display: flex;
		align-items: center;
		width: 95%;
		&-input {
			width: 100%;
			height: $clickable-area - $entity-spacing !important;
			margin: $entity-spacing 0;
			padding-left: $clickable-area !important;
			font-size: 16px;
			line-height: $clickable-area - $entity-spacing;
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
		justify-content: flex-start;
		// half a line height to know there is more lines
		max-height: 6.5em;
		padding: $entity-spacing 0;
		border-bottom: 1px solid var(--color-background-darker);
		background: var(--color-main-background);

		// Allows 2 per line
		.entity-picker__bubble {
			max-width: calc(50% - #{$entity-spacing});
			margin-right: $entity-spacing;
			margin-bottom: $entity-spacing;
		}
	}

	&__options {
		overflow-y: auto;
		flex: 1 1 100%;
		margin: $entity-spacing 0;
	}

	&__navigation {
		z-index: 1;
		display: flex;
		// define our base width, no shrinkage
		flex: 0 0;
		justify-content: space-between;
		// Same as above
		width: 100%;
		box-shadow: 0 -10px 5px var(--color-main-background);
		&__button-right {
			margin-left: auto;
		}
	}
}

// Properly center Entity Picker empty content
:deep(.empty-content) {
	margin: auto 0 !important;
}

/** Size full in the modal component doesn't have border radius, this adds
it back */
:deep(.modal-container) {
	border-radius: var(--border-radius-large) !important;
}

:deep(.modal-container__close) {
	margin-top: 19px;
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
