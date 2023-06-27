<!--
 - @copyright Copyright (c) 2023 Andrey Borysenko <andrey18106x@gmail.com>
 -
 - @author 2023 Andrey Borysenko <andrey18106x@gmail.com>
 -
 - @license AGPL-3.0-or-later
 -
 - This program is free software: you can redistribute it and/or modify
 - it under the terms of the GNU Affero General Public License as
 - published by the Free Software Foundation, either version 3 of the
 - License, or (at your option) any later version.
 -
 - This program is distributed in the hope that it will be useful,
 - but WITHOUT ANY WARRANTY; without even the implied warranty of
 - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 - GNU Affero General Public License for more details.
 -
 - You should have received a copy of the GNU Affero General Public License
 - along with this program. If not, see <http://www.gnu.org/licenses/>.
 -
 -->

<template>
	<div class="profile_picker-referece">
		<div class="profile_picker-wrapper">
			<div class="profile-card-header">
				<NcAvatar :user="richObject.user_id" :size="48" class="profile-avatar" />
				<div class="profile-title">
					<a :href="richObject.url" target="_blank">
						<UserIcon :size="20" />
						<strong>
							{{ richObject.email !== null ? richObject.title + ' - ' + richObject.email : richObject.title }}
						</strong>
					</a>
				</div>
			</div>
			<div class="profile-content">
				<p class="profile-subline">
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

import MapMarker from 'vue-material-design-icons/MapMarker.vue'
import TextAccount from 'vue-material-design-icons/TextAccount.vue'
import UserIcon from './icons/UserIcon.vue'
import Domain from 'vue-material-design-icons/Domain.vue'
import Web from 'vue-material-design-icons/Web.vue'
import Handshake from 'vue-material-design-icons/Handshake.vue'

export default {
	name: 'ProfilePickerReferenceWidget',
	components: {
		NcAvatar,
		MapMarker,
		TextAccount,
		UserIcon,
		Domain,
		Web,
		Handshake,
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
.profile_picker-referece {
	width: 100%;
	white-space: normal;
	display: flex;

	.profile_picker-wrapper {
		width: 100%;
		display: flex;
		align-items: center;
		flex-direction: column;

		.profile-card-header {
			width: 100%;
			min-height: 70px;
			background-color: var(--color-primary);
			background-image: var(--gradient-primary-background);
			position: relative;

			.profile-avatar {
				position: relative;
				bottom: -50%;
				left: 10px;
			}

			.profile-title {
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

		.profile-subline {
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
