<!--
  - @copyright Copyright (c) 2023 Avinash Gusain <avinash.gusain.ext@murena.com>
  -
  - @author Avinash Gusain <avinash.gusain.ext@murena.com>
  -
  - @license GNU AGPL version 3 or any later version
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
	<div class="contact-header-starred__wrapper">
		<ActionButton :disabled="isLoading" @click="callValidateGroup('starred')">
			<template #icon>
				<IconStar :class="{ 'starred-icon': starred }" :size="24" />
			</template>
		</ActionButton>
	</div>
</template>

<script>
import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton.js'
import IconStar from 'vue-material-design-icons/Star.vue'

export default {
	name: 'ContactDetailsStarred',

	components: {
		ActionButton,
		IconStar,
	},

	props: {
		contact: {
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			starred: false,
			isLoading: false,
		}
	},
	created() {
		this.handleStarred = (response) => {
			this.starred = response
			this.isLoading = false
		}
		this.handleIsStarred = (response) => {
			if (this.contact.key === response.contact.key) {
				this.starred = response.starred
			}
		}
		this.$root.$on('starred-response', this.handleStarred)
		this.$root.$on('is-starred', this.handleIsStarred)
	},
	methods: {
	/**
	 * Dispatch contact addition to group
	 *
	 * @param {string} groupName the group name
	 */
		callValidateGroup(groupName) {
			this.$nextTick(() => {
				this.isLoading = true
				this.starred = !this.starred
				this.$root.$emit('starred-update', groupName, this.starred)
			})
		},

	},

}
</script>
<style lang="scss" scoped>
.contact-header-starred {
	&__wrapper {
		position: relative;
		height: 75px;
		li {
			list-style-type:none;
			width:24px;
			margin: 0 16px;
			height: 36px;
			line-height: 36px;
			.starred-icon {
				::v-deep .material-design-icon__svg {
					fill: #FC0;
					path {
						stroke: #FC0;
						stroke-width: 1px;
					}
				}
			}
			::v-deep .material-design-icon__svg {
				fill: var(--color-primary-text);
				path {
					stroke: var(--icon-inactive-color);
					stroke-width: 1px;
				}
			}
		}
	}
}

</style>
