/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { sortStrings } from '../../../src/utils/strings'

/**
 * Load sortStrings with the collator built for the given locale
 *
 * @param {string} locale the user locale returned by getCanonicalLocale()
 * @return {Function} sortStrings bound to that locale
 */
function loadSortStrings(locale) {
	jest.resetModules()
	jest.doMock('@nextcloud/l10n', () => ({ getCanonicalLocale: () => locale }))
	return require('../../../src/utils/strings').sortStrings
}

describe('utils/strings test suite', () => {
	it('sorting flat strings', () => {
		const test = sortStrings('ABC', 'BCA')
		expect(test < 0).toEqual(true)
	})

	it('sorting strings with diacritics', () => {
		const test = sortStrings('Třeboni', 'České')
		expect(test > 0).toEqual(true)
	})

	it('natural sorting', () => {
		const test = sortStrings('Group 9', 'Group 10')
		expect(test < 0).toEqual(true)
	})

	it('builds the collator from a locale with a region', () => {
		const sort = loadSortStrings('en-GB')

		const sorted = ['Zebra', 'Group 10', 'Group 9'].sort(sort)

		expect(sorted).toEqual(['Group 9', 'Group 10', 'Zebra'])
	})

	it('sorts Å, Ä, Ö after Z in Swedish', () => {
		const sort = loadSortStrings('sv')

		const sorted = ['Öland', 'Zebra', 'Ängel', 'Anna', 'Åre'].sort(sort)

		expect(sorted).toEqual(['Anna', 'Zebra', 'Åre', 'Ängel', 'Öland'])
	})

	it('sorts Å, Ä, Ö as accented A and O in English', () => {
		const sort = loadSortStrings('en')

		const sorted = ['Öland', 'Zebra', 'Ängel', 'Anna', 'Åre'].sort(sort)

		expect(sorted).toEqual(['Ängel', 'Anna', 'Åre', 'Öland', 'Zebra'])
	})

	it('sorts é and è as variants of e in French', () => {
		const sort = loadSortStrings('fr')

		const sorted = ['ez', 'èb', 'ea', 'éa'].sort(sort)

		expect(sorted).toEqual(['ea', 'éa', 'èb', 'ez'])
	})

	it('sorts ü and ű as variants of u in French', () => {
		const sort = loadSortStrings('fr')

		const sorted = ['űc', 'uz', 'üa', 'ua', 'úb'].sort(sort)

		expect(sorted).toEqual(['ua', 'üa', 'úb', 'űc', 'uz'])
	})

	it('sorts ü and ű as separate letters after u in Hungarian', () => {
		const sort = loadSortStrings('hu')

		const sorted = ['űc', 'uz', 'üa', 'ua', 'úb'].sort(sort)

		expect(sorted).toEqual(['ua', 'úb', 'uz', 'üa', 'űc'])
	})

	it('keeps natural sorting with a non-English locale', () => {
		const sort = loadSortStrings('sv')

		const sorted = ['Öst 2', 'Grupp 10', 'Grupp 9'].sort(sort)

		expect(sorted).toEqual(['Grupp 9', 'Grupp 10', 'Öst 2'])
	})
})
