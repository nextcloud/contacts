<template>
	<div class="node-container">
		<div class="inner-box">
			<a href="" @click.prevent.stop="onAvatarClick(data.nodeId)">
				<Avatar
					:disable-tooltip="true"
					:display-name="data.fullName"
					:is-no-user="true"
					:size="60"
					:url="data.photoUrl"
					class="avatar" />
			</a>
			<div class="panel" />
			<div class="main-container">
				<h3 class="fullName">
					{{ data.fullName }}
				</h3>
				<h4 class="title">
					{{ data.title }}
				</h4>
			</div>
			<div class="description">
				<p v-if="data._directSubordinates">
					{{ t('contacts', 'Manages') }}: {{ data._directSubordinates }}
				</p>
				<p v-if="data._totalSubordinates">
					{{ t('contacts', 'Oversees') }}: {{ data._totalSubordinates }}
				</p>
			</div>
		</div>
	</div>
</template>

<script>
import Avatar from '@nextcloud/vue/dist/Components/Avatar'

export default {
	name: 'ChartTemplate',
	components: {
		Avatar,
	},
	props: {
		data: {
			type: Object,
			default: () => {},
		},
		onAvatarClick: {
			type: Function,
			default: () => {},
		},
	},
}
</script>
