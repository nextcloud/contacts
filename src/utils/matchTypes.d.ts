/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/**
 * Match a list of types against the available types
 *
 * @param selectedTypes
 * @param options
 */
export declare function matchTypes(selectedTypes: Array<string>, options: Array<{
	id: string
	name: string
}>): {
	type: {
		id: string
		name: string
	}
	score: number
} | undefined
