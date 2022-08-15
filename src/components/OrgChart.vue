<template>
	<div class="orgchart-container">
		<div class="chart-menu">
			<Multiselect
				v-model="chart"
				:options="charts"
				track-by="id"
				label="label"
				@input="chartChanged" />
		</div>
		<div ref="svgElementContainer" class="chart-container" />
	</div>
</template>

<script>
import Multiselect from '@nextcloud/vue/dist/Components/Multiselect'
import { OrgChart } from 'd3-org-chart'
import * as d3 from 'd3'
import axios from '@nextcloud/axios'

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
					label: `${head.org} Chart (${head.fullName})`,
				}
			})
		},
	},
	watch: {
		data(value) {
			if (this.data[this.chart]?.length) {
				this.retrieveImages(this.data[this.chart])
					.then(d => {
						this.renderChart(d)
					})
			}
		},
	},
	created() {
		if (this.data[this.chart]?.length) {
			this.retrieveImages(this.data[this.chart])
				.then(d => {
					this.renderChart(d)
				})
		}
	},
	methods: {
		chartChanged({ id }) {
			if (this.data[id]?.length) {
				this.retrieveImages(this.data[id])
					.then(d => {
						this.renderChart(d)
					})
			}
		},
		retrieveImages(value) {
			return Promise.all(
				!value
					? [value]
					: value.map(cur => {
						if (!cur.photoUrl) return cur
						return axios.get(cur.photoUrl, {
							responseType: 'arraybuffer',
						})
							.then(res => {
								cur.image = `data:${res.headers['content-type']};base64, ${Buffer.from(res.data, 'binary').toString('base64')}`
								return cur
							})
							.catch(() => {
								return cur
							})
					}))
				.then(d => d)
		},
		renderChart(data) {
			if (!this.chartReference) {
				this.chartReference = new OrgChart()
			}
			this.chartReference
				.container(this.$refs.svgElementContainer) // node or css selector
				.data(data)
				.nodeWidth((d) => 250)
				.initialZoom(0.8)
				.nodeHeight((d) => 175)
				.childrenMargin((d) => 40)
				.compactMarginBetween((d) => 15)
				.compactMarginPair((d) => 80)
				.nodeContent(function(d, i, arr, state) {
					const imgEl = `<img src="${d.data.image || 'data:image/jpeg;base64,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'}" alt="${d.data.fullName}" style="margin-top:-30px;margin-left:${d.width / 2 - 30}px;border-radius:100px;border:1px solid lightgray;width:60px;height:60px;background-color: white" />`

					return `
						<div style="padding-top:30px;background-color:none;margin-left:1px;height:${d.height}px;border-radius:2px;overflow:visible">
							<div class="inner-box" style="height:${d.height - 32}px;padding-top:0px;background-color:white;border:1px solid lightgray;border-radius:5px">
								<a href="${d.data.link}">
									${imgEl}
								</a>
								<div style="margin-top:-27px;background-color:#3AB6E3;height:10px;width:${d.width - 2}px;border-radius:1px" />
								<div style="padding:20px; padding-top:35px;text-align:center">
									<div style="color:#111672;font-size:16px;font-weight:bold"> ${d.data.fullName}</div>
									<div style="color:#404040;font-size:16px;margin-top:4px"> ${d.data.title}</div>
								</div> 
								<div style="display:flex;justify-content:space-between;padding-left:15px;padding-right:15px;">
									<div> Manages:  ${d.data._directSubordinates} 👤</div>  
									<div> Oversees: ${d.data._totalSubordinates} 👤</div>    
								</div>
							</div>     
						</div>
					`
				})
				.nodeUpdate(function(d, i, arr) {
					d3.select(this)
						.select('.node-rect')
						.attr('stroke', (d) =>
							d.data._highlighted || d.data._upToTheRootHighlighted
								? '#14760D'
								: 'none'
						)
				})
				.linkUpdate(function(d, i, arr) {
					d3.select(this)
						.attr('stroke', (d) =>
							d.data._upToTheRootHighlighted ? '#14760D' : '#2CAAE5'
						)
						.attr('stroke-width', (d) =>
							d.data._upToTheRootHighlighted ? 3 : 1
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
