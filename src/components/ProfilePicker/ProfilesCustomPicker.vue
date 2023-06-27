<template>
	<div class="profiles-picker-content">
		<div class="heading">
			<h2>
				{{ t('contacts', 'Profile picker') }}
			</h2>
			<div class="input-wrapper">
				<NcSelect ref="profiles-search-input"
					v-model="selectedProfile"
					input-id="profiles-search"
					:loading="loading"
					:filterable="false"
					:placeholder="t('contacts', 'Search for a user profile')"
					:clear-search-on-blur="() => false"
					:user-select="true"
					:multiple="false"
					:options="options"
					@search="searchForProfile"
					@option:selecting="resolveResult">
					<template #no-options="{ search }">
						{{ search ? noResultText : t('contacts', 'Search for a user profile. Start typing') }}
					</template>
				</NcSelect>
			</div>
			<NcEmptyContent class="empty-content">
				<template #icon>
					<UserIcon />
				</template>
			</NcEmptyContent>
		</div>
		<div class="footer">
			<NcButton v-if="selectedProfile !== null"
				type="primary"
				:aria-label="t('contacts', 'Insert selected user profile link')"
				:disabled="loading || selectedProfile === null"
				@click="submit">
				{{ t('contacts', 'Insert') }}
				<template #icon>
					<ArrowRightIcon />
				</template>
			</NcButton>
		</div>
	</div>
</template>

<script>
import ArrowRightIcon from 'vue-material-design-icons/ArrowRight.vue'
import UserIcon from './icons/UserIcon.vue'

import NcSelect from '@nextcloud/vue/dist/Components/NcSelect.js'
import NcButton from '@nextcloud/vue/dist/Components/NcButton.js'
import NcEmptyContent from '@nextcloud/vue/dist/Components/NcEmptyContent.js'

import axios from '@nextcloud/axios'
import { generateOcsUrl, generateUrl } from '@nextcloud/router'
import debounce from "debounce";

export default {
	name: 'ProfilesCustomPicker',

	components: {
		NcSelect,
		NcButton,
		ArrowRightIcon,
		UserIcon,
		NcEmptyContent,
	},

	props: {
		providerId: {
			type: String,
			required: true,
		},
		accessible: {
			type: Boolean,
			default: false,
		},
	},

	computed: {
		options() {
			if (this.searchQuery !== '') {
				return this.profiles
			}
			return []
		},
		noResultText() {
			return this.loading ? t('contacts', 'Searching...') : t('contacts', 'Not found')
		},
	},

	data() {
		return {
			searchQuery: '',
			loading: false,
			resultUrl: null,
			reference: null,
			profiles: [],
			selectedProfile: null,
			abortController: null,
		}
	},

	mounted() {
		this.focusOnInput()
	},

	methods: {
		focusOnInput() {
			setTimeout(() => {
				this.$refs['profiles-search-input'].$el.getElementsByTagName('input')[0]?.focus()
			}, 300)
		},
		async searchForProfile(query) {
			if (query.trim() === '' || query.trim().length < 3) {
				return
			}
			this.searchQuery = query.trim()
			this.loading = true
			await this.debounceFindProfiles(query)
		},
		debounceFindProfiles: debounce(function (...args) {
			this.findProfiles(...args)
		}, 300),
		async findProfiles(query) {
			const url = generateOcsUrl('core/autocomplete/get?search={searchQuery}&itemType=%20&itemId=%20&shareTypes[]=0&limit=20', { searchQuery: query })
			await axios.get(url).then(res => {
				this.profiles = res.data.ocs.data.map(userAutocomplete => {
					return {
						user: userAutocomplete.id,
						displayName: userAutocomplete.label,
						icon: userAutocomplete.icon,
						subtitle: userAutocomplete.subline,
						isNoUser: userAutocomplete.source.startsWith('users'),
					}
				})
			}).catch(err => {
				console.debug(err)
			})
			this.loading = false
		},
		submit() {
			this.resultUrl = window.location.origin + generateUrl(`/u/${this.selectedProfile.user.trim().toLowerCase()}`, null, { noRewrite: true })
			this.$emit('submit', this.resultUrl)
		},
		resolveResult(selectedItem) {
			this.loading = true
			this.abortController = new AbortController()
			this.selectedProfile = selectedItem
			this.resultUrl = window.location.origin + generateUrl(`/u/${this.selectedProfile.user.trim().toLowerCase()}`, null, { noRewrite: true })
			axios.get(generateOcsUrl('references/resolve', 2) + '?reference=' + encodeURIComponent(this.resultUrl), {
				signal: this.abortController.signal,
			})
				.then((response) => {
					this.reference = response.data.ocs.data.references[this.resultUrl]
				})
				.catch((error) => {
					console.error(error)
				})
				.then(() => {
					this.loading = false
				})
		},
		clearSelection() {
			this.selectedProfile = null
			this.resultUrl = null
			this.reference = null
		},
	},
}
</script>

<style scoped lang="scss">
.heading, .select {
	width: 100%;
}

.profiles-picker-content {
	width: 100%;
	min-height: 450px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px 16px 16px;

	h2 {
		text-align: center;
	}

	.footer {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: end;
		margin-top: 12px;
		> * {
			margin-left: 4px;
		}
	}
}
</style>
