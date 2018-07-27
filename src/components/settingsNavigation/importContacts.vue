<template>
	<div class="import-contact">
		<multiselect v-model="value" :options="options"
			:placeholder="t('contacts', 'Contacts')"
			class="multiselect-vue" />
	</div>
</template>

<script>
import clickOutside from 'vue-click-outside'
import Multiselect from 'vue-multiselect'

export default {
	components: {
		clickOutside,
		Multiselect
	},
	directives: {
		clickOutside
	},
	// props: ['addressbooks'],
	props: {
		addressbooks: {
			type: Array,
			required: false,
			default: undefined
		}
	},
	data() {
		return {
			value: ''
		}
	},
	computed: {
		options() {
			return [t('contacts', 'Contacts')].concat(this.addressbooks.map(x => x.displayName))
		}
	},
	methods: {

	}
}
</script>
