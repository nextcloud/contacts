import { generateUrl } from '@nextcloud/router'
import { GROUP_ALL_CONTACTS } from '../models/constants.ts'

export const getChart = (allNodes, currentNode) => {
	const result = [currentNode]
	const children = allNodes.filter(node => {
		return node.nodeId !== currentNode.nodeId && node.parentNodeId === currentNode.nodeId
	})

	return [
		...result,
		...children.flatMap(child => getChart(allNodes, child)),
	]
}

export const transformNode = (contact) => {
	return {
		nodeId: contact.uid,
		key: contact.key,
		parentNodeId: contact.managersName,
		fullName: contact.displayName,
		org: contact.org,
		photoUrl: `${contact.url}?photo`,
		title: contact.title,
		link: generateUrl(`apps/contacts/${GROUP_ALL_CONTACTS}/${contact.key}`),
		expanded: !contact.managersName,
	}
}
