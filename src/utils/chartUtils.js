import { generateUrl } from '@nextcloud/router'
import { GROUP_ALL_CONTACTS } from '../models/constants.ts'

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

export const transformNode = (contact) => {
	return {
		nodeId: contact.uid,
		parentNodeId: contact.managersName ? contact.managersName.split('~')[0] : null,
		fullName: contact.displayName,
		org: contact.org,
		photoUrl: `${contact.url}?photo`,
		title: contact.title,
		link: generateUrl(`apps/contacts/${GROUP_ALL_CONTACTS}/${contact.key}`),
		expanded: !contact.managersName,
	}
}
