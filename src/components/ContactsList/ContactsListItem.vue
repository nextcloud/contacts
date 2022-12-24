<template>
	<ListItem :id="id"
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
</template>

<script>
import { NcListItem as ListItem } from '@nextcloud/vue'
import BaseAvatar from '@nextcloud/vue/dist/Components/NcAvatar.js'

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
