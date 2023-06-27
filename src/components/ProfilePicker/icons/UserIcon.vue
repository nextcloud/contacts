<template>
	<span :aria-hidden="!title"
		:aria-label="title"
		class="material-design-icon user-icon"
		role="img"
		v-bind="$attrs"
		@click="$emit('click', $event)">
		<svg :fill="fillColor"
			:width="size"
			:height="size"
			enable-background="new 0 0 24 24"
			version="1.1"
			viewBox="0 0 24 24"
			xml:space="preserve"
			xmlns="http://www.w3.org/2000/svg">
			<path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
		</svg>
	</span>
</template>

<script>
export default {
	name: 'UserIcon',
	props: {
		title: {
			type: String,
			default: '',
		},
		fillColor: {
			type: String,
			default: 'currentColor',
		},
		size: {
			type: Number,
			default: 24,
		},
	},
}
</script>
