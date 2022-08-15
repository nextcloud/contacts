export const getChart = (list, parent, nodes = []) => {
	if (!nodes.length) nodes.push(list.find(node => node.nodeId === parent))
	const children = list.filter(node => {
		return node.parentNodeId === parent
	})

	children.forEach(node => {
		nodes.push(node)
		getChart(list, node.nodeId, nodes)
	})

	return nodes
}
