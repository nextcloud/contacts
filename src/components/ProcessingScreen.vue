<template>
	<EmptyContent class="processing-screen__wrapper" icon="icon-contacts-dark">
		<slot />
		<template #desc>
			<div class="processing-screen__progress">
				<progress :max="total" :value="progress" />
			</div>
			<div class="processing-screen__desc">
				<slot name="desc" />
			</div>
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
		display: flex;
		width: 100%;
	}

	&__desc {
		display: inline-flex;
		align-items: center;
		width: 100%;
		margin-top: 22px;
		color: var(--color-text-maxcontrast);

		&::v-deep button {
			min-width: 100px;
			height: 44px;
			padding: 10px 20px;

			// Put buttons at the end
			&:first-of-type {
				margin-left: auto;
			}
		}
	}
}

</style>
