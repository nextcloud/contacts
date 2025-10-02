<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<div
		class="contacts-list__item-wrapper"
		:draggable="isDraggable"
		@dragstart="startDrag($event, source)"
		@click.shift.exact.prevent="onSelectMultipleRange">
		<ListItem
			:id="id"
			:key="source.key"
			class="list-item-style envelope"
			:name="source.displayName"
			:to="{ name: 'contact', params: { selectedGroup: selectedGroup, selectedContact: source.key } }">
			<!-- @slot Icon slot -->

			<template #icon>
				<div
					class="contacts-list__item-icon"
					@click.exact.prevent="onSelectMultiple"
					@mouseenter="hoveringAvatar = true"
					@mouseleave="hoveringAvatar = false">
					<NcAvatar
						v-if="!source.isMultiSelected && !hoveringAvatar && source.addressbook.id === 'z-server-generated--system'"
						:user="source.uid"
						:hide-status="true"
						:size="40" />
					<NcAvatar
						v-if="!source.isMultiSelected && !hoveringAvatar && source.addressbook.id !== 'z-server-generated--system'"
						:display-name="source.displayName"
						:url="avatarUrl"
						:size="40" />
					<CheckIcon
						v-if="source.isMultiSelected || hoveringAvatar"
						:size="28"
						:class="{ 'contacts-list__item-avatar-selected': source.isMultiSelected, 'contacts-list__item-avatar-hovered': !source.isMultiSelected }" />
				</div>
			</template>
			<template #subname>
				<div class="envelope__subtitle">
					<span class="envelope__subtitle__subject">
						{{ source.email ? source.email : getTel }}
					</span>
				</div>
			</template>
		</ListItem>
	</div>
</template>

<script>
import {
	NcListItem as ListItem,
	NcAvatar,
} from '@nextcloud/vue'
import CheckIcon from 'vue-material-design-icons/Check.vue'
import RouterMixin from '../../mixins/RouterMixin.js'

export default {
	name: 'ContactsListItem',

	components: {
		ListItem,
		NcAvatar,
		CheckIcon,
	},

	mixins: [
		RouterMixin,
	],

	props: {
		index: {
			type: Number,
			required: true,
		},

		source: {
			type: Object,
			required: true,
		},

		reloadBus: {
			type: Object,
			required: true,
		},

		onSelectMultipleFromParent: {
			type: Function,
			default: () => {},
		},
	},

	data() {
		return {
			avatarUrl: undefined,
			hoveringAvatar: false,
		}
	},

	computed: {
		// contact is not draggable when it has not been saved on server as it can't be added to groups/circles before
		isDraggable() {
			return !!this.source.dav && this.source.addressbook.id !== 'z-server-generated--system'
		},

		// usable and valid html id for scrollTo
		id() {
			return this.source.key.slice(0, -2)
		},

		getTel() {
			return this.source.properties.find((property) => property.name === 'tel')?.getFirstValue()
		},
	},

	created() {
		this.reloadBus.on('reload-avatar', this.reloadAvatarUrl)
		this.reloadBus.on('delete-avatar', this.deleteAvatar)
	},

	unmounted() {
		this.reloadBus.off('reload-avatar', this.reloadAvatarUrl)
		this.reloadBus.off('delete-avatar', this.deleteAvatar)
	},

	async mounted() {
		await this.loadAvatarUrl()
	},

	methods: {
		startDrag(evt, item) {
			evt.dataTransfer.dropEffect = 'move'
			evt.dataTransfer.effectAllowed = 'move'
			evt.dataTransfer.setData('item', JSON.stringify({
				addressbookId: item.addressbook.id,
				displayName: item.displayName,
				groups: item.groups,
				url: item.url,
				uid: item.uid,
			}))
		},

		/**
		 * Is called on save in ContactDetails to reload Avatar,
		 * url does not change, so trigger on source change don't work
		 *
		 * @param {string} key from contact
		 */
		reloadAvatarUrl(key) {
			if (key === this.source.key) {
				this.loadAvatarUrl()
			}
		},

		/**
		 * Is called on save in ContactDetails to delete Avatar,
		 * somehow the avatarUrl is not unavailable immediately, so we just set undefined
		 *
		 * @param {string} key from contact
		 */
		deleteAvatar(key) {
			if (key === this.source.key) {
				this.avatarUrl = undefined
			}
		},

		async loadAvatarUrl() {
			this.avatarUrl = undefined
			if (this.source.photo) {
				const photoUrl = await this.source.getPhotoUrl()
				if (!photoUrl) {
					console.warn('contact has an invalid photo')
					// Invalid photo data
					return
				}
				this.avatarUrl = photoUrl
			} else if (this.source.hasPhoto && this.source.url) {
				this.avatarUrl = `${this.source.url}?photo`
			}
		},

		/**
		 * Select this contact within the list
		 */
		selectContact() {
			// change url with router
			this.$router.push({
				name: 'contact',
				params: { selectedGroup: this.selectedGroup, selectedContact: this.source.key },
			})
		},

		onSelectMultiple() {
			// This weirdness of passing a function as a prop is because the VirtualList extra-props prop object does not support listening to custom events (afaik)
			this.onSelectMultipleFromParent(this.source, this.index)
		},

		onSelectMultipleRange() {
			this.onSelectMultipleFromParent(this.source, this.index, true)
		},
	},
}
</script>

<style lang="scss" scoped>

.envelope {
	.contacts-list__item-icon {
		height: 40px; // To prevent some unexpected spacing below the avatar
	}

	&__subtitle {
		display: flex;
		gap: var(--default-grid-baseline);

		&__subject {
			line-height: 130%;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}

:deep(.list-item) {
	list-style: none;
	padding-inline: calc(var(--default-grid-baseline) * 3);
	padding-block: calc(var(--default-grid-baseline) * 2);
}

</style>

<style lang="scss">
.contacts-list__item-wrapper {
	&[draggable='true'] .avatardiv * {
		cursor: move !important;
	}

	&[draggable='false'] .avatardiv * {
		cursor: not-allowed !important;
	}
}

.contacts-list__item-icon {
	cursor: pointer !important;
}

.contacts-list__item-avatar {

	&-selected, &-hovered {
		border-radius: 32px;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&-selected {
		background-color: var(--color-primary-element);
		color: var(--color-primary-light);
	}

	&-hovered {
		color: var(--color-primary-hover);
		background-color: var(--color-primary-light-hover);
	}
}
</style>
