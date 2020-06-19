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
					:placeholder="t('contacts', 'Search contacts')">
			</div>

			<!-- Content -->
			<div class="entity-picker__content">
				<!-- Picked entities -->
				<transition-group
					v-if="selection.length > 0"
					name="zoom"
					tag="ul"
					class="entity-picker__selection">
					<EntityBubble
						v-for="entity in selection"
						:key="entity.key || `entity-${entity.type}-${entity.id}`"
						v-bind="entity"
						@delete="onDelete(entity)" />
				</transition-group>

				<!-- Searched & picked entities -->
				<template v-if="searchSet.length > 0 && availableEntities.length > 0">
					<section v-for="type in availableEntities" :key="type.id" class="entity-picker__options">
						<h4 v-if="isSingleType" class="entity-picker__options-caption">
							{{ t('contacts', 'Add {type}', {type: type.label}) }}
						</h4>
						<EntitySearchResult v-for="entity in type.dataSet"
							:key="entity.key || `entity-${entity.type}-${entity.id}`"
							v-bind="entity" />
					</section>
				</template>
				<EmptyContent v-else-if="searchQuery" icon="icon-search">
					{{ t('contacts', 'No results') }}
				</EmptyContent>
				<!-- TODO: find better wording/icon -->
				<EmptyContent v-else icon="">
					{{ t('contacts', 'Loading …') }}
				</EmptyContent>
			</div>

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
import EntityBubble from './EntityBubble'
import EntitySearchResult from './EntitySearchResult'

export default {
	name: 'EntityPicker',

	components: {
		EmptyContent,
		EntityBubble,
		EntitySearchResult,
		Modal,
	},

	props: {
		dataSet: {
			type: Array,
			required: true,
		},
		dataTypes: {
			type: Array,
			required: true,
		},
		sort: {
			type: String,
			default: 'label',
		},
	},

	data() {
		return {
			searchQuery: '',
			selection: [
				{ type: 'user', label: 'Test 4 Lorem ipsum is a very long user name', id: 'test4' },
				{ type: 'user', label: 'Test 2', id: 'test2' },
				{ type: 'user', label: 'Test 1 (AVHJ)', id: 'tes2' },
				{ type: 'user', label: 'Test 278 975 869', id: 'tebst2' },
				{ type: 'user', label: 'Administrator', id: 'tespot2' },
			],
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
				return [{
					id: this.dataTypes[0].id,
					label: this.dataTypes[0].label,
					dataSet: this.searchSet,
				}]
			}

			// Else group by types
			return this.dataTypes.map(type => ({
				id: type.id,
				label: type.label,
				dataSet: this.searchSet.filter(entity => entity.type === type),
			}))
		},
	},

	methods: {
		onCancel() {
			this.$emit('close')
		},
		onSubmit() {
			this.$emit('submit', this.selection)
		},
		/**
		 * Remove entity from selection
		 * @param {Object} entity the entity to remove
		 */
		onDelete(entity) {
			const index = this.selection.findIndex(search => search === entity)
			this.selection.splice(index, 1)
			console.debug('Removing entity from selection', entity)
		},
	},

}

</script>

<style lang="scss" scoped>

// Dialog variables
$dialog-margin: 20px;
$dialog-width: 300px;
$dialog-height: 480px;

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

	&__search {
		position: relative;
		display: flex;
		align-items: center;
		&-input {
			width: 100%;
			height: $clickable-area !important;
			padding-left: $clickable-area;
			font-size: 16px;
			line-height: $clickable-area;
		}
		&-icon {
			position: absolute;
			width: $clickable-area;
			height: $clickable-area;
		}
	}

	&__content {
		height: 100%;
	}

	&__selection {
		display: flex;
		overflow-y: auto;
		align-content: flex-start;
		flex: 1 0 auto;
		flex-wrap: wrap;
		// half a line height to know there is more lines
		max-height: 6.5em;
		padding: 4px 0;
		border-bottom: 1px solid var(--color-background-darker);
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

.entity-picker__options {
	margin: 4px 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	&-caption {
		color: var(--color-primary);
		line-height: $clickable-area;
		list-style-type: none;
		white-space: nowrap;
		text-overflow: ellipsis;
		box-shadow: none !important;
		user-select: none;
		pointer-events: none;
		padding-left: 10px;

		&:not(:first-child) {
			margin-top: $clickable-area / 2;
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
