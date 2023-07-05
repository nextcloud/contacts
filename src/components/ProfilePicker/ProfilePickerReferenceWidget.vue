<template>
	<div class="profile-reference">
		<div class="profile-reference__wrapper">
			<div class="profile-card__header">
				<NcAvatar :user="richObject.user_id" :size="48" class="profile-card__avatar" />
				<div class="profile-card__title">
					<a :href="richObject.url" target="_blank">
						<Account :size="20" />
						<strong>
							{{ richObject.email !== null ? richObject.title + ' - ' + richObject.email : richObject.title }}
						</strong>
					</a>
				</div>
			</div>
			<div class="profile-content">
				<p class="profile-content__subline">
					<span v-if="richObject.headline" class="headline">
						{{ richObject.headline }}
					</span>
					<span v-if="richObject.location" class="location">
						<MapMarker :size="20" />
						<template v-if="richObject.location_url">
							<a :href="richObject.location_url" class="link" target="_blank">{{ richObject.location }}</a>
						</template>
						<template v-else>
							{{ richObject.location }}
						</template>
					</span>
					<span v-if="richObject.website" class="website">
						<Web :size="20" />
						<a :href="richObject.website" class="link" target="_blank">{{ richObject.website }}</a>
					</span>
					<span v-if="richObject.organisation" class="organisation">
						<Domain :size="20" />
						{{ richObject.organisation }}
					</span>
					<span v-if="richObject.role" class="role">
						<Handshake :size="20" />
						{{ richObject.role }}
					</span>
					<span v-if="richObject.bio" class="bio">
						<TextAccount :size="20" />
						{{ richObject.bio }}
					</span>
				</p>
			</div>
		</div>
	</div>
</template>

<script>
import NcAvatar from '@nextcloud/vue/dist/Components/NcAvatar.js'

import Account from 'vue-material-design-icons/Account.vue'
import MapMarker from 'vue-material-design-icons/MapMarker.vue'
import Web from 'vue-material-design-icons/Web.vue'
import Domain from 'vue-material-design-icons/Domain.vue'
import Handshake from 'vue-material-design-icons/Handshake.vue'
import TextAccount from 'vue-material-design-icons/TextAccount.vue'

export default {
	name: 'ProfilePickerReferenceWidget',
	components: {
		NcAvatar,
		Account,
		MapMarker,
		Web,
		Domain,
		Handshake,
		TextAccount,
	},
	props: {
		richObjectType: {
			type: String,
			default: '',
		},
		richObject: {
			type: Object,
			default: null,
		},
		accessible: {
			type: Boolean,
			default: true,
		},
	},
}
</script>

<style scoped lang="scss">
.profile-reference {
	width: 100%;
	white-space: normal;
	display: flex;

	&__wrapper {
		width: 100%;
		display: flex;
		align-items: center;
		flex-direction: column;

		.profile-card__header {
			width: 100%;
			min-height: 70px;
			background-color: var(--color-primary);
			background-image: var(--gradient-primary-background);
			position: relative;
		}

		.profile-card__avatar {
			position: relative;
			bottom: -50%;
			left: 10px;
		}

		.profile-card__title {
			display: flex;
			position: relative;
			bottom: 5px;
			left: 70px;

			& span {
				margin-right: 5px;
			}

			& a {
				display: flex;
				color: #fff;
			}
		}

		.profile-content {
			display: flex;
			flex-direction: column;
			justify-content: center;
			min-height: 46px;
			padding: 10px 10px 10px 60px;
			width: 100%;
		}

		.headline {
			font-style: italic;
			padding-left: 5px;
		}

		.profile-content__subline {
			padding: 0 0 0 10px;

			& span.material-design-icon {
				margin-right: 5px;
			}

			& > span {
				display: flex;
				align-items: center;
				margin-bottom: 5px;
			}
		}

		.link {
			text-decoration: underline;
		}
	}
}
</style>
