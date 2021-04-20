<!--
	- @copyright Copyright (c) 2021 John Molakvoæ <skjnldsv@protonmail.com>
	-
	- @author John Molakvoæ <skjnldsv@protonmail.com>
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
	<AppContentDetails>
		<!-- contact header -->
		<DetailsHeader>
			<!-- avatar and upload photo -->
			<template #avatar="{avatarSize}">
				<Avatar
					:disable-tooltip="true"
					:display-name="circle.displayName"
					:is-no-user="true"
					:size="avatarSize" />
			</template>

			<!-- display name -->
			<input
				slot="title"
				v-model="circle.displayName"
				:readonly="!circle.isOwner"
				:placeholder="t('contacts', 'Circle name')"
				type="text"
				autocomplete="off"
				autocorrect="off"
				spellcheck="false"
				name="displayname"
				@input="debounceUpdateCircle">

			<!-- org, title -->
			<template #subtitle>
			</template>

			<!-- actions -->
			<template #actions>
			</template>

			<!-- menu actions -->
			<template #actions-menu>
			</template>
		</DetailsHeader>

		<section class="circle-details-section">
			<ContentHeading>{{ t('contacts', 'Description') }}</ContentHeading>

			<RichContenteditable class="circle-details-section__description"
				:value="circle.description"
				:auto-complete="onAutocomplete"
				:maxlength="1024"
				:multiline="true"
				:disabled="loading"
				:placeholder="t('contacts', 'Enter a description for the circle')"
				@submit="onDescriptionSubmit" />
		</section>

		<section class="circle-details-section">
			<CircleConfigs class="circle-details-section__configs" :circle="circle" />
		</section>
	</AppContentDetails>
</template>

<script>
import AppContentDetails from '@nextcloud/vue/dist/Components/AppContentDetails'
import Avatar from '@nextcloud/vue/dist/Components/Avatar'
import RichContenteditable from '@nextcloud/vue/dist/Components/RichContenteditable'
import DetailsHeader from './DetailsHeader'
import CircleConfigs from './CircleDetails/CircleConfigs'
import ContentHeading from './CircleDetails/ContentHeading'

export default {
	name: 'CircleDetails',

	components: {
		AppContentDetails,
		Avatar,
		CircleConfigs,
		ContentHeading,
		DetailsHeader,
		RichContenteditable,
	},

	props: {
		circleId: {
			type: String,
			required: true,
		},
	},

	computed: {
		circle() {
			return this.$store.getters.getCircle(this.circleId)
		},
	},
	methods: {
		/**
		 * Autocomplete @mentions on the description
		 * @param {string} search the search term
		 * @param {Function} callback callback to be called with results array
		 */
		onAutocomplete(search, callback) {
			// TODO: implement autocompletion. Disabled for now
			// eslint-disable-next-line node/no-callback-literal
			callback([])
		},

		onDescriptionSubmit() {
			console.info(...arguments)
		},
	},
}
</script>

<style lang="scss" scoped>
.app-content-details {
	flex: 1 1 100%;
	min-width: 0;
}

.circle-details-section {
	padding: 0 80px;

	&:not(:first-of-type) {
		margin-top: 24px;
	}

	&__description {
		max-width: 400px;
	}
}
</style>
