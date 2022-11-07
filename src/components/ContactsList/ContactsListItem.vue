<template>
	<div class="contacts-list__item"
		:class="{'contacts-list__item--active': selectedContact === source.key}"
		@mouseover="hover = true"
		@mouseleave="hover = false">
		<ActionCheckbox v-if="hover || ischecked"
			:checked="ischecked"
			@check="isSelected"
			@uncheck="isUnselected" />
		<BasesAvatar v-else-if="!hover && !ischecked"
			:size="44"
			:user="source.displayName"
			:display-name="source.displayName"
			:is-no-user="true" />
		<ListItem
			:id="id"
			:key="source.key"
			class="list-item-style envelope"
			:title="source.displayName"
			:to="{ name: 'contact', params: { selectedGroup: selectedGroup, selectedContact: source.key } }">
			<!-- @slot Icon slot -->

			<template #icon>
				<div class="app-content-list-item-icon">
					<BaseAvatar :display-name="source.displayName" :url="avatarUrl" :size="40" />
				</div>
			</template>
			<template #subtitle>
				<div class="envelope__subtitle">
					<span class="envelope__subtitle__subject">
						{{ source.email }}
					</span>
				</div>
			</template>
		</ListItem>
	</div>
</template>

<script>
import ActionCheckbox from '@nextcloud/vue/dist/Components/ActionCheckbox'
import { NcListItem as ListItem } from '@nextcloud/vue'
import BaseAvatar from '@nextcloud/vue/dist/Components/NcAvatar'

export default {
	name: 'ContactsListItem',

	components: {
		ListItem,
		BaseAvatar,
		ActionCheckbox,
	},

	props: {
		index: {
			type: Number,
			required: true,
		},
		source: {
			type: Object,
			required: true,
		},
		selected: {
			type: Array,
			required: false
		}
	},
	data() {
		return {
			avatarUrl: undefined,
			hover: false,
			ischecked: false,
		}
	},
	beforeMount() {
		// check the checkbox who is already selected
		if (this.selected.includes(this.source.key)) {
			this.ischecked = true
		}
	},
	computed: {
		selectedGroup() {
			return this.$route.params.selectedGroup
		},
		selectedContact() {
			return this.$route.params.selectedContact
		},

		// usable and valid html id for scrollTo
		id() {
			return window.btoa(this.source.key).slice(0, -2)
		},
	},
	watch: {
		async source() {
			await this.loadAvatarUrl()
		},
	},
	async mounted() {
		await this.loadAvatarUrl()
	},
	methods: {
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
			} else if (this.source.url) {
				this.avatarUrl = `${this.source.url}?photo`
			}
		},

		isSelected() {
			this.ischecked = true
			// update the selected
			this.$parent.$parent.$emit('update-check-selected', this.source.key)
		},

		isUnselected() {
			this.ischecked = false
			// update the selected
			this.$parent.$parent.$emit('update-check-selected', this.source.key)
		},

		/**
		 * Select this contact within the list
		 */
		selectContact() {
			// change url with router
			this.$router.push({ name: 'contact', params: { selectedGroup: this.selectedGroup, selectedContact: this.source.key } })
		},
	},
}
</script>
<style lang="scss" scoped>

.envelope {
	.app-content-list-item-icon {
		height: 40px; // To prevent some unexpected spacing below the avatar
	}

	&__subtitle {
		display: flex;
		gap: 4px;

		&__subject {
			color: var(--color-main-text);
			line-height: 130%;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}

.list-item-style {
	list-style: none;
}

</style>
