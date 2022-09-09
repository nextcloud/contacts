<template>
	<ListItemIcon
		:id="id"
		:key="source.key"
		:avatar-size="44"
		:class="{'contacts-list__item--active': selectedContact === source.key}"
		:display-name="source.displayName"
		:is-no-user="true"
		:subtitle="source.email"
		:title="source.displayName"
		:url="avatarUrl"
		class="contacts-list__item"
		tabindex="0"
		@click.prevent.stop="selectContact"
		@keypress.enter.prevent.stop="selectContact" />
</template>

<script>
import ListItemIcon from '@nextcloud/vue/dist/Components/NcListItemIcon'

export default {
	name: 'ContactsListItem',

	components: {
		ListItemIcon,
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
.contacts-list__item {
	padding: 8px;

	&--active,
	&:focus,
	&:hover {
		background-color: var(--color-background-hover);
	}

	&, ::v-deep * {
		cursor: pointer;
	}
}
</style>
