<template>
	<EmptyContent class="processing-screen__wrapper" icon="icon-contacts-dark">
		<slot />
		<template #desc>
			<div class="processing-screen__progress">
				<progress :max="total" :value="progress" />
			</div>
			<slot name="desc" />
		</template>
	</EmptyContent>
</template>

<script>
import EmptyContent from '@nextcloud/vue/dist/Components/EmptyContent'

export default {
	name: 'ProcessingScreen',

	components: {
		EmptyContent,
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
	},
}
</script>

<style lang="scss" scoped>
.processing-screen {
	&__wrapper {
		display: flex;
		flex-direction: column;
		width: auto;
		min-width: 30vw;
		margin: 50px;

		// Progress wrapper
		&::v-deep > p {
			display: flex;
			width: 80%;
			margin: auto;
		}

		button {
			padding: 10px;
			height: 44px;
			align-self: flex-end;
			margin-top: 22px;
			min-width: 100px;
		}
	}

	&__progress {
		width: 100%;
		display: flex;
	}
}
</style>
