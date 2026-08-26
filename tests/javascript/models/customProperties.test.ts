/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { CustomPropertyConfig } from '../../../src/models/customProperties'
import { applyCustomProperties } from '../../../src/models/customProperties'

describe('customProperties', () => {

	let properties: Record<string, object>
	let fieldOrder: string[]

	beforeEach(() => {
		properties = {
			tel: { readableName: 'Phone' },
		}
		fieldOrder = ['tel']
	})

	test('registers a plain text property with defaults', () => {
		applyCustomProperties(properties, fieldOrder, [
			{ name: 'x-customernumber', label: 'Customer number' },
		])

		expect(properties['x-customernumber']).toEqual({
			readableName: 'Customer number',
			icon: 'icon-detailed-name',
			force: 'text',
			multiple: false,
			primary: false,
		})
		expect(fieldOrder).toContain('x-customernumber')
	})

	test('options on a text property become TYPE choices with the first one preselected', () => {
		applyCustomProperties(properties, fieldOrder, [
			{
				name: 'x-office',
				label: 'Office',
				multiple: true,
				options: [{ id: 'BERLIN', name: 'Berlin' }, { id: 'LINGEN', name: 'Lingen' }],
			},
		])

		expect(properties['x-office']).toMatchObject({
			multiple: true,
			defaultValue: { value: '', type: ['BERLIN'] },
		})
	})

	test('options on a select property are value choices without a preselected default', () => {
		applyCustomProperties(properties, fieldOrder, [
			{
				name: 'x-region',
				label: 'Region',
				force: 'select',
				options: [{ id: 'NORTH', name: 'North' }],
			},
		])

		expect(properties['x-region']).toMatchObject({ force: 'select' })
		expect(properties['x-region']).not.toHaveProperty('defaultValue')
	})

	test('skips names colliding with builtin properties', () => {
		applyCustomProperties(properties, fieldOrder, [
			{ name: 'tel', label: 'Phone override' },
		])

		expect(properties.tel).toEqual({ readableName: 'Phone' })
		expect(fieldOrder).toEqual(['tel'])
	})

	test('skips entries without x- prefix or name', () => {
		applyCustomProperties(properties, fieldOrder, [
			{ name: 'customernumber', label: 'Customer number' },
			{ label: 'No name' },
			null,
		] as CustomPropertyConfig[])

		expect(Object.keys(properties)).toEqual(['tel'])
	})

	test('normalizes uppercase names', () => {
		applyCustomProperties(properties, fieldOrder, [
			{ name: 'X-Customernumber', label: 'Customer number' },
		])

		expect(properties['x-customernumber']).toBeDefined()
	})

	test('tolerates a non-array state', () => {
		applyCustomProperties(properties, fieldOrder, undefined as unknown as CustomPropertyConfig[])
		applyCustomProperties(properties, fieldOrder, 'garbage' as unknown as CustomPropertyConfig[])

		expect(Object.keys(properties)).toEqual(['tel'])
	})
})
