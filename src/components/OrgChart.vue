<template>
	<div class="org-chart">
		<div v-if="data.length > 1" class="org-chart__menu">
			<h3>
				{{ t('contacts', 'Chart') }}:
			</h3>
			<Multiselect
				v-model="chart"
				class="chart-selection"
				:disabled="data.length === 1"
				:options="charts"
				:allow-empty="false"
				:searchable="false"
				:placeholder="placeholder"
				track-by="id"
				label="label"
				@input="chartChanged" />
		</div>
		<div ref="svgElementContainer" class="org-chart__container" />
	</div>
</template>

<script>
import * as d3 from 'd3'
import ChartTemplate from './ChartTemplate.vue'
import Multiselect from '@nextcloud/vue/dist/Components/NcMultiselect'
import { OrgChart } from 'd3-org-chart'
import router from './../router'
import Vue from 'vue'

export default {
	name: 'OrgChart',
	components: {
		Multiselect,
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
				const head = nodes.find(node => node.parentNodeId === null)
				return {
					id: index,
					label: head.org ? `${head.org} (${head.fullName})` : head.fullName,
				}
			})
		},
		placeholder() {
			return t('contacts', 'Select chart …')
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
			const that = this
			if (!this.chartReference) {
				this.chartReference = new OrgChart()
			}

			this.chartReference
				.container(this.$refs.svgElementContainer) // node or css selector
				.data(data)
				.nodeWidth(() => 250)
				.initialZoom(1)
				.nodeHeight(() => 175)
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
							const ComponentClass = Vue.extend(ChartTemplate)
							const instance = new ComponentClass({
								propsData: {
									data: d.data,
									onAvatarClick: (uid) => that.goToContact(uid),
								},
								router,
							}).$mount()
							d.data.rendered = instance.$el
							containerHTMLElement.appendChild(instance.$el)
						}
					}

					d3.select(this)
						.select('.inner-box')
						.attr('class', (dRect) => dRect.data._highlighted || dRect.data._upToTheRootHighlighted ? 'inner-box inner-box-highlight' : 'inner-box')
				})
				.linkUpdate(function(d) {
					d3.select(this)
						.attr('stroke', () => 'var(--color-primary)')
						.attr('stroke-width', (dRect) =>
							dRect.data._upToTheRootHighlighted ? 2 : 1
						)

					if (d.data._upToTheRootHighlighted) {
						d3.select(this).raise()
					}
				})
				.onNodeClick(d => {
					if (!this.chartReference.data().filter(item => item.nodeId === d)[0]._upToTheRootHighlighted) {
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

	&__menu {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		border: 1px solid var(--color-border);

		h3 {
			padding-left: 50px;
			padding-right: 10px;
			margin: 9px 0;
		}
	}

	&__container {
		display: flex;
		background-color: var(--color-main-background);
	}

	::v-deep .node-button-div {
		color: var(--color-primary-element);
		div {
			background-color: var(--color-main-background) !important;
		}
	}
}
</style>
