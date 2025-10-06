<!--
  - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<div class="org-chart">
		<div v-if="data.length > 1" class="org-chart__menu">
			<h3>
				{{ t('contacts', 'Chart') }}:
			</h3>
			<NcSelect
				v-model="chart"
				class="chart-selection"
				:disabled="data.length === 1"
				:options="charts"
				:allow-empty="false"
				:searchable="false"
				:placeholder="placeholder"
				input-id="select-chart-input"
				label="label"
				@update:model-value="chartChanged" />
		</div>
		<div ref="svgElementContainer" class="org-chart__container" />
	</div>
</template>

<script>
import { getLocale } from '@nextcloud/l10n'
import { NcSelect } from '@nextcloud/vue'
import * as d3 from 'd3'
import { OrgChart } from 'd3-org-chart'
import { createApp } from 'vue'
import ChartTemplate from './ChartTemplate.vue'
import LegacyGlobalMixin from '../mixins/LegacyGlobalMixin.js'
import router from './../router/index.js'

export default {
	name: 'OrgChart',
	components: {
		NcSelect,
	},

	props: {
		data: {
			type: Array,
			default: () => [],
		},
	},

	data() {
		return {
			chartReference: null,
			chart: 0,
		}
	},

	computed: {
		charts() {
			return this.data.map((nodes, index) => {
				const head = nodes.find((node) => node.parentNodeId === null)
				return {
					id: index,
					label: head.org ? `${head.org} (${head.fullName})` : head.fullName,
				}
			}).sort((a, b) => {
				return a.label.localeCompare(
					b.label,
					getLocale().replace('_', '-'),
					{ sensitivity: 'base' },
				)
			})
		},

		placeholder() {
			return t('contacts', 'Select chart …')
		},
	},

	watch: {
		data() {
			if (this.data[this.chart]?.length) {
				this.renderChart(this.data[this.chart])
			}
		},
	},

	mounted() {
		if (this.data[this.chart]?.length) {
			this.renderChart(this.data[this.chart])
		}
	},

	methods: {
		chartChanged(inputProps) {
			this.renderChart(this.data[inputProps.id])
		},

		goToContact(key) {
			this.$router.push({
				name: 'contact',
				params: {
					selectedGroup: this.$route.params.selectedChart,
					selectedContact: key,
				},
			})
		},

		renderChart(data) {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const that = this
			if (!this.chartReference) {
				this.chartReference = new OrgChart()
			}

			this.chartReference
				.container(this.$refs.svgElementContainer) // node or css selector
				.data(data)
				.nodeWidth(() => 250)
				.initialZoom(1)
				.nodeHeight(() => 200)
				.childrenMargin(() => 70)
				.compactMarginBetween(() => 15)
				.compactMarginPair(() => 80)
				.nodeContent(() => {
					return ''
				})
				.nodeUpdate(function(d) {
					// Render vue component node template for each node
					const containerHTMLElement = this.querySelector('.node-foreign-object-div')
					if (containerHTMLElement) {
						// Avoid re-render if already we have rendered component
						if (d.data.rendered) {
							containerHTMLElement.appendChild(d.data.rendered)
						} else {
							const app = createApp(ChartTemplate, {
								chartData: d.data,
								onAvatarClick: (uid) => that.goToContact(uid),
							})
							app.use(router)
							app.mixin(LegacyGlobalMixin)
							const $el = document.createElement('div')
							app.mount($el)
							d.data.rendered = $el
							containerHTMLElement.appendChild($el)
						}
					}

					d3.select(this)
						.select('.inner-box')
						.attr('class', (dRect) => dRect.data._highlighted || dRect.data._upToTheRootHighlighted ? 'inner-box inner-box-highlight' : 'inner-box')
				})
				.linkUpdate(function(d) {
					d3.select(this)
						.attr('stroke', () => 'var(--color-primary-element)')
						.attr('stroke-width', (dRect) => dRect.data._upToTheRootHighlighted ? 2 : 1)

					if (d.data._upToTheRootHighlighted) {
						d3.select(this).raise()
					}
				})
				.onNodeClick((d) => {
					if (!this.chartReference.data().filter((item) => item.nodeId === d)[0]._upToTheRootHighlighted) {
						this.chartReference.clearHighlighting()
						this.chartReference.setUpToTheRootHighlighted(d).render()
					} else {
						this.chartReference.clearHighlighting()
					}
				})
				.render()
		},
	},
}
</script>

<style lang="scss">
.org-chart {
	display: flex;
	flex-direction: column;
	height: 100%;

	&__menu {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		border: 1px solid var(--color-border);

		h3 {
			padding-inline: 50px 10px;
			margin: 9px 0;
		}
	}

	&__container {
		display: flex;
		background-color: var(--color-main-background);
		height: 100%;

		svg {
			height: 100%;
		}
	}

	.node-button-div {
		filter: var(--background-invert-if-dark);

		& > div > div {
			filter: var(--background-invert-if-dark);
		}
	}
}
</style>
