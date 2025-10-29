/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import axios from '@nextcloud/axios'
import { generateOcsUrl } from '@nextcloud/router'
import { SHARES_TYPES_MEMBER_MAP } from '../models/constants.ts'

// generate allowed shareType from SHARES_TYPES_MEMBER_MAP
const shareType = Object.keys(SHARES_TYPES_MEMBER_MAP)
const maxAutocompleteResults = parseInt(window.OC.config['sharing.maxAutocompleteResults'], 10) || 25

/**
 * Get suggestions
 *
 * @param {string} search the search query
 */
export async function getSuggestions(search) {
	const request = await axios.get(generateOcsUrl('apps/files_sharing/api/v1/sharees'), {
		params: {
			format: 'json',
			itemType: 'contacts',
			search,
			perPage: maxAutocompleteResults,
			shareType,
			lookup: false,
		},
	})

	const data = request.data.ocs.data
	const exact = request.data.ocs.data.exact
	data.exact = [] // removing exact from general results

	// flatten array of arrays
	const rawExactSuggestions = Object.values(exact).reduce((arr, elem) => arr.concat(elem), [])
	const rawSuggestions = Object.values(data).reduce((arr, elem) => arr.concat(elem), [])

	// remove invalid data and format to user-select layout
	const exactSuggestions = rawExactSuggestions
		.filter((result) => typeof result === 'object')
		.map((share) => formatResults(share))
		// sort by type so we can get user&groups first...
		.sort((a, b) => a.shareType - b.shareType)
	const suggestions = rawSuggestions
		.filter((result) => typeof result === 'object')
		.map((share) => formatResults(share))
		// sort by type so we can get user&groups first...
		.sort((a, b) => a.shareType - b.shareType)

	const allSuggestions = exactSuggestions.concat(suggestions)

	// Count occurances of display names in order to provide a distinguishable description if needed
	const nameCounts = allSuggestions.reduce((nameCounts, result) => {
		if (!result.displayName) {
			return nameCounts
		}
		if (!nameCounts[result.displayName]) {
			nameCounts[result.displayName] = 0
		}
		nameCounts[result.displayName]++
		return nameCounts
	}, {})

	const finalResults = allSuggestions.map((item) => {
		// Make sure that items with duplicate displayName get the shareWith applied as a description
		if (nameCounts[item.displayName] > 1 && !item.desc) {
			return { ...item, desc: item.shareWithDisplayNameUnique }
		}
		return item
	})

	console.info('suggestions', finalResults)

	return finalResults
}

/**
 * Get the sharing recommendations
 */
export async function getRecommendations() {
	const request = await axios.get(generateOcsUrl('apps/files_sharing/api/v1/sharees_recommended'), {
		params: {
			format: 'json',
			itemType: 'contacts',
			shareType,
		},
	})

	// flatten array of arrays
	const exact = request.data.ocs.data.exact
	const recommendations = Object.values(exact).reduce((arr, elem) => arr.concat(elem), [])

	// remove invalid data and format to user-select layout
	const finalResults = recommendations
		.map((share) => formatResults(share))

	console.info('recommendations', finalResults)

	return finalResults
}

function formatResults(result) {
	const type = `picker-${result.value.shareType}`
	return {
		label: result.label,
		id: `${type}-${result.value.shareWith}`,
		// If this is a user, set as user for avatar display by UserBubble
		user: [window.OC.Share.SHARE_TYPE_USER, window.OC.Share.SHARE_TYPE_REMOTE].indexOf(result.value.shareType) > -1
			? result.value.shareWith
			: null,
		type,
		...result.value,
	}
}
