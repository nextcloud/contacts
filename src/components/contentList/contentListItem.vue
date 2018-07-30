<template>
	<a :class="{active: selectedContact === contact.key}" href="" class="app-content-list-item"
		@click.prevent.stop="selectContact">
		<input ref="selected" :id="contact.uid" type="checkbox"
			class="app-content-list-item-checkbox checkbox">
		<label :for="contact.uid" @click.prevent.stop="toggleSelect" />
		<div :style="{ 'backgroundColor': colorAvatar }" class="app-content-list-item-icon">{{ contact.displayName | firstLetter }}</div>
		<div class="app-content-list-item-line-one">{{ contact.displayName }}</div>
		<div v-if="contact.email" class="app-content-list-item-line-two">{{ contact.email }}</div>
		<div v-if="contact.addressbook.enabled" class="icon-delete" @click.prevent.stop="deleteContact" />
	</a>
</template>

<script>
export default {
	name: 'ContentlistItem',
	filters: {
		firstLetter(value) {
			return value.charAt(0)
		}
	},
	props: {
		contact: {
			type: Object,
			required: true
		}
	},
	computed: {
		selectedGroup() {
			return this.$route.params.selectedGroup
		},
		selectedContact() {
			return this.$route.params.selectedContact
		},
		colorAvatar() {
			try {
				let color = this.contact.uid.toRgb()
				return `rgb(${color.r}, ${color.g}, ${color.b})`
			} catch (e) {
				return 'grey'
			}
		}
	},
	methods: {
		toggleSelect() {
			// toggle checkbox here because we stop the propagation to not trigger selectContact
			this.$refs.selected.checked = !this.$refs.selected.checked
		},
		deleteContact() {
			this.$store.dispatch('deleteContact', this.contact)
		},
		selectContact() {
			// change url with router
			this.$router.push({ name: 'contact', params: { selectedGroup: this.selectedGroup, selectedContact: this.contact.key } })
		}
	}
}
</script>
