/**
 * @copyright Copyright (c) 2023 Daniel Kesselberg <mail@danielkesselberg.de>
 *
 * @author Daniel Kesselberg <mail@danielkesselberg.de>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
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
