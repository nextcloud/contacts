<template>
	<router-link :to="{ name: 'contact', params: { selectedGroup: selectedGroup, selectedContact: contact.uid}}"
		exact href="#" class="app-content-list-item">
		<input :id="contact.uid" type="checkbox" class="app-content-list-item-checkbox checkbox"
			@change="toggleSelect">
		<label :for="contact.uid" />
		<div class="app-content-list-item-icon">{{ contact.displayName | firstLetter }}</div>
		<div class="app-content-list-item-line-one">{{ contact.displayName }}</div>
		<div v-if="contact.email" class="app-content-list-item-line-two">{{ contact.email }}</div>
		<div class="icon-delete" @click.native="deleteItem" />
	</router-link>
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
		}
	},
	methods: {
		toggleSelect() {
		},
		deleteItem() {
			alert('deleted!')
		}
	}
}
</script>
