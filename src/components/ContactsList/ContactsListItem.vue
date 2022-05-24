<template>
	<div class="contacts-list__item"
		:class="{'contacts-list__item--active': selectedContact === source.key}"
		@mouseover="hover = true"
		@mouseleave="hover = false">
		<ActionCheckbox v-if="hover || ischecked"
			:checked="ischecked"
			@check="isSelected"
			@uncheck="isUnselected" />
		<Avatar v-else-if="!hover && !ischecked"
			:size="44"
			:user="source.displayName"
			:display-name="source.displayName"
			:is-no-user="true" />
		<ListItem
			style="height=100%"
			:id="id"
			:key="source.key"
			:display-name="source.displayName"
			:subtitle="source.email"
			:title="source.displayName"
			@click.prevent.stop="selectContact"
			@keypress.enter.prevent.stop="selectContact">
		</ListItem>
	</div>
</template>

<script>
import ActionCheckbox from '@nextcloud/vue/dist/Components/ActionCheckbox'
import Avatar from '@nextcloud/vue/dist/Components/Avatar'
import ListItem from '@nextcloud/vue/dist/Components/ListItem'

export default {
	name: 'ContactsListItem',

	components: {
		ActionCheckbox,
		ListItem,
		Avatar,
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
.contacts-list__item {
	padding: 8px;
	display: flex;
	list-style-type: none;

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
