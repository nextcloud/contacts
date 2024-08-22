/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { matchTypes } from '../../../src/utils/matchTypes'
import rfcProps from '../../../src/models/rfcProps.js'

describe('utils/matchTypes test suite', () => {

	describe('impp', () => {
		it('matches', () => {
			const selectedTypes = ['XMPP']

			const match = matchTypes(
				selectedTypes,
				rfcProps.properties.impp.options,
			)

			expect(match).toMatchObject({
				type: { id: 'XMPP', name: 'XMPP' },
				score: 2,
			})
		})

		it('does not match', () => {
			const selectedTypes = ['TEST']

			const match = matchTypes(
				selectedTypes,
				rfcProps.properties.impp.options,
			)

			expect(match).toBeUndefined()
		})
	})

	describe('tel', () => {
		it('complete match, one type', () => {
			const selectedTypes = ['VOICE']

			const match = matchTypes(
				selectedTypes,
				rfcProps.properties.tel.options,
			)

			expect(match).toMatchObject({
				type: { id: 'VOICE', name: 'Voice' },
				score: 2,
			})
		})

		it('complete match, two types', () => {
			const selectedTypes = ['HOME', 'VOICE']

			const match = matchTypes(
				selectedTypes,
				rfcProps.properties.tel.options,
			)

			expect(match).toMatchObject({
				type: { id: 'HOME,VOICE', name: 'Home' },
				score: 3,
			})
		})

		it('partial match, two types', () => {
			const selectedTypes = ['HOME', 'VOICE']

			const options = [
				{ id: 'HOME,VOICE,TEST', name: 'Home' },
				{ id: 'HOME,VOICE', name: 'Home' },
				{ id: 'HOME', name: 'Home' },
				{ id: 'WORK,VOICE,TEST', name: 'Work' },
				{ id: 'WORK,VOICE', name: 'Work' },
				{ id: 'WORK', name: 'Work' },
				{ id: 'VOICE', name: 'Voice' },
				{ id: 'TEST', name: 'Test' },
			]

			const match = matchTypes(
				selectedTypes,
				options,
			)

			expect(match).toMatchObject({
				type: { id: 'HOME,VOICE', name: 'Home' },
				score: 3,
			})
		})

		it('does not match', () => {
			const selectedType = ['TEST']

			const match = matchTypes(
				selectedType,
				rfcProps.properties.tel.options,
			)

			expect(match).toBeUndefined()
		})
	})

	describe('misc', () => {
		it('empty list', () => {
			const selectedType = ['TEST']

			const match = matchTypes(
				selectedType,
				[],
			)

			expect(match).toBeUndefined()
		})
	})
})
