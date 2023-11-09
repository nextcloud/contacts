<template>
	<ListItem :id="id"
		:key="source.key"
		class="list-item-style envelope"
		:name="source.displayName"
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
</template>

<script>
import {
	NcListItem as ListItem,
	NcAvatar as BaseAvatar,
} from '@nextcloud/vue'

export default {
	name: 'ContactsListItem',

	components: {
		ListItem,
		BaseAvatar,
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
		reloadBus: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			avatarUrl: undefined,
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

	created() {
		this.reloadBus.$on('reload-avatar', this.reloadAvatarUrl)
		this.reloadBus.$on('delete-avatar', this.deleteAvatar)
	},
	destroyed() {
		this.reloadBus.$off('reload-avatar', this.reloadAvatarUrl)
		this.reloadBus.$off('delete-avatar', this.deleteAvatar)
	},
	async mounted() {
		await this.loadAvatarUrl()
	},
	methods: {

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
			} else if (this.source.url) {
				this.avatarUrl = `${this.source.url}?photo`
			}
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
