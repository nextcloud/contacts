<template>
	<div>
		<EmptyContent :description="desc"
			:title="title"
			class="processing-screen__wrapper">
			<template #icon>
				<IconContact :size="20" />
			</template>
		</EmptyContent>
		<div class="processing-screen__progress">
			<progress :max="total" :value="progress" />
		</div>
	</div>
</template>

<script>
import EmptyContent from '@nextcloud/vue/dist/Components/NcEmptyContent.js'
import IconContact from 'vue-material-design-icons/AccountMultiple.vue'
export default {
	name: 'ProcessingScreen',

	components: {
		EmptyContent,
		IconContact,
	},

	props: {
		total: {
			type: Number,
			required: true,
		},
		progress: {
			type: Number,
			required: true,
		},
		desc: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
	},
}
</script>

<style lang="scss" scoped>
.processing-screen {
	&__wrapper {
		display: flex;
		flex-direction: column;
		width: auto;
		margin: 50px;

		// Progress &desc wrapper
		&::v-deep > p {
			display: flex;
			align-items: center;
			flex-direction: column;
			width: 80%;
			margin: auto;
		}
	}

	&__progress {
		padding: 0 12px;
	}
}
</style>
