<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcGuestContent app-name="contacts" class="wayf">
		<template #default>
			<div class="wayf-body">
				<div v-if="token !== ''">
					<h2>{{ t('contacts', 'Select your server') }}</h2>
					<NcFormBox class="wayf-form">
						<div v-if="hasFederationData" class="wayf-search">
							<NcTextField
								id="wayf-search"
								v-model="query"
								:label="t('contacts', 'Type to search')"
								type="search"
								name="search">
								<template #icon>
									<Magnify :size="20" />
								</template>
							</NcTextField>
							<div v-if="hasVisibleProviders">
								<div
									v-for="group in visibleFederations"
									:key="group.federation">
									<h3>{{ group.federation }}</h3>
									<ul class="wayf-list">
										<NcListItem
											v-for="p in group.providers"
											:key="p.fqdn"
											:href="p.inviteUrl"
											:name="p.name"
											one-line>
											<template #icon>
												<NcListItemIcon :name="p.name" :subname="p.fqdn">
													<WeatherCloudyArrowRight :size="20" />
												</NcListItemIcon>
											</template>
										</NcListItem>
									</ul>
								</div>
							</div>
							<p v-else class="wayf-empty">
								{{ t('contacts', 'No servers match your search.') }}
							</p>
						</div>
						<p v-else class="wayf-empty">
							{{ t('contacts', 'No servers are currently available.') }}
						</p>
						<div class="wayf-manual">
							<NcTextField
								id="wayf-manual"
								v-model="manualProvider"
								:label="t('contacts', 'Your server not listed? Enter one manually.')"
								type="text"
								name="manual"
								@keydown.enter.prevent="goToManualProvider">
								<template #icon>
									<WeatherCloudyArrowRight :size="20" />
								</template>
							</NcTextField>
							<div class="wayf-manual-actions">
								<NcButton variant="primary" @click="goToManualProvider">
									{{ t('contacts', 'Continue') }}
								</NcButton>
							</div>
						</div>
					</NcFormBox>
				</div>
				<div v-else>
					<p>{{ t('contacts', 'You need an invite link for this feature to work.') }}</p>
				</div>
			</div>
		</template>
	</NcGuestContent>
</template>

<script>
import axios from '@nextcloud/axios'
import { showError } from '@nextcloud/dialogs'
import { generateUrl } from '@nextcloud/router'
import {
	NcButton,
	NcGuestContent,
	NcListItem,
	NcListItemIcon,
	NcTextField,
} from '@nextcloud/vue'
import NcFormBox from '@nextcloud/vue/components/NcFormBox'
import Magnify from 'vue-material-design-icons/Magnify.vue'
import WeatherCloudyArrowRight from 'vue-material-design-icons/WeatherCloudyArrowRight.vue'

export default {
	name: 'Wayf',
	components: {
		Magnify,
		NcButton,
		NcFormBox,
		NcGuestContent,
		NcListItem,
		NcListItemIcon,
		NcTextField,
		WeatherCloudyArrowRight,
	},

	props: {
		federations: { type: Object, default: () => ({}) },
		providerDomain: { type: String, default: '' },
		token: { type: String, default: '' },
	},

	data: () => ({ query: '', manualProvider: '' }),

	computed: {
		hasFederationData() {
			return Object.keys(this.federations || {}).length > 0
		},

		visibleFederations() {
			return Object.entries(this.federations || {}).reduce((groups, [federation, providers]) => {
				const visibleProviders = this.filteredBy(providers)
				if (visibleProviders.length > 0) {
					groups.push({
						federation,
						providers: visibleProviders,
					})
				}
				return groups
			}, [])
		},

		hasVisibleProviders() {
			return this.visibleFederations.length > 0
		},
	},

	methods: {
		async discoverProvider(base) {
			const resp = await axios.get(generateUrl('/apps/contacts/discover'), {
				params: { base },
				timeout: 8000,
			})
			if (!resp.data?.inviteAcceptDialogAbsolute) {
				throw new Error('Discovery failed')
			}

			// append provider & token safely
			const u = new URL(resp.data.inviteAcceptDialogAbsolute)
			if (this.providerDomain) {
				u.searchParams.set('providerDomain', this.providerDomain)
			}
			if (this.token) {
				u.searchParams.set('token', this.token)
			}
			return u.toString()
		},

		providerInviteUrl(providerEntry) {
			const source = providerEntry?.inviteAcceptDialog || ''
			if (!source) {
				return ''
			}
			try {
				const url = new URL(source, window.location.origin)
				if (this.providerDomain) {
					url.searchParams.set('providerDomain', this.providerDomain)
				}
				if (this.token) {
					url.searchParams.set('token', this.token)
				}
				return url.toString()
			} catch (error) {
				return ''
			}
		},

		filteredBy(providers) {
			const s = (this.query || '').toLowerCase()
			if (!Array.isArray(providers)) {
				return []
			}
			return providers.reduce((list, providerEntry) => {
				const name = String(providerEntry?.name || '')
				const fqdn = String(providerEntry?.fqdn || '')
				const inviteUrl = this.providerInviteUrl(providerEntry)
				if (inviteUrl === '') {
					return list
				}
				if (!name.toLowerCase().includes(s) && !fqdn.toLowerCase().includes(s)) {
					return list
				}
				list.push({
					...providerEntry,
					name: name || fqdn,
					fqdn,
					inviteUrl,
				})
				return list
			}, [])
		},

		async goToManualProvider() {
			const input = (this.manualProvider || '').trim()
			if (!input) {
				return
			}
			try {
				const target = await this.discoverProvider(input)
				window.location.href = target
			} catch (error) {
				showError(this.t('contacts', 'Could not discover that provider. Check the address and try again.'))
			}
		},
	},
}
</script>

<style lang="scss">
#contacts-wayf {
  background: var(--color-background-plain);
  color: var(--color-background-plain-text);
  border-radius: var(--border-radius-large);
}

.wayf-list {
  text-align: start;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.wayf-list > li {
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--default-grid-baseline) * 2);

  padding: calc(var(--default-grid-baseline) * 3) calc(var(--default-grid-baseline) * 4);
  margin: var(--default-grid-baseline) 0;

  background-color: var(--color-background-dark);
  color: var(--color-main-text);

  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.15s;
}

.wayf-list > li:hover {
  background-color: var(--color-background-darker);
}

.wayf-list > li:active {
  background-color: var(--color-primary);
  color: var(--color-primary-text);
}

.wayf-empty {
  margin-block: calc(var(--default-grid-baseline) * 3) calc(var(--default-grid-baseline) * 4);
  color: var(--color-text-maxcontrast);
}

.wayf-manual {
  margin-top: calc(var(--default-grid-baseline) * 4);
}

.wayf-manual-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: calc(var(--default-grid-baseline) * 2);
}
</style>
