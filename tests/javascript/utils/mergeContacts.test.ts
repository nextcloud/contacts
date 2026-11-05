/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as ICALModule from 'ical.js'
import {
	comparePropertyLists,
	getPropertyValue,
	isPropertyEmpty,
	isPropertyListEmpty,
	valuesEqual,
} from '../../../src/utils/mergeContacts.ts'

// ical.js is published as an ESM default export but resolves to a CommonJS
// module under ts-jest; support both shapes.
const ICAL = ('default' in ICALModule ? ICALModule.default : ICALModule) as typeof ICALModule.default

/**
 * Build a vCard string from its body lines.
 *
 * @param lines the properties of the contact
 */
function vcard(lines: string[]): string {
	return ['BEGIN:VCARD', 'VERSION:3.0', 'UID:test', ...lines, 'END:VCARD'].join('\r\n')
}

/**
 * Return the ICAL properties of a given name from a vCard body.
 *
 * @param lines the properties of the contact
 * @param name the property name to extract
 */
function propertiesOf(lines: string[], name: string) {
	const component = new ICAL.Component(ICAL.parse(vcard(lines)))
	return component.getAllProperties(name)
}

describe('mergeContacts - valuesEqual', () => {
	test('compares scalars', () => {
		expect(valuesEqual('a', 'a')).toBe(true)
		expect(valuesEqual('a', 'b')).toBe(false)
		expect(valuesEqual('', '')).toBe(true)
		expect(valuesEqual(null, null)).toBe(true)
	})

	test('compares arrays by value, not by reference', () => {
		// The original bug: two distinct arrays with identical contents
		// compared with === always returned false.
		expect(valuesEqual(['nick'], ['nick'])).toBe(true)
		expect(valuesEqual(['a', 'b'], ['a', 'b'])).toBe(true)
		expect(valuesEqual(['a', 'b'], ['b', 'a'])).toBe(false)
		expect(valuesEqual(['a'], ['a', 'b'])).toBe(false)
	})

	test('handles nested arrays', () => {
		expect(valuesEqual([['a', 'b']], [['a', 'b']])).toBe(true)
		expect(valuesEqual([['a', 'b']], [['a', 'c']])).toBe(false)
	})
})

describe('mergeContacts - getPropertyValue', () => {
	test('returns null for a missing property', () => {
		expect(getPropertyValue(undefined)).toBe(null)
		expect(getPropertyValue(null)).toBe(null)
	})

	test('returns a scalar for single-value properties', () => {
		const [fn] = propertiesOf(['FN:John'], 'fn')
		expect(getPropertyValue(fn)).toBe('John')
	})

	test('returns an array for plain multi-value properties (nickname)', () => {
		const [nickname] = propertiesOf(['NICKNAME:nick'], 'nickname')
		expect(getPropertyValue(nickname)).toEqual(['nick'])
	})

	test('returns the first (array) value for structured properties (adr)', () => {
		const [adr] = propertiesOf(['ADR;TYPE=HOME:;;Main Street;City;;;'], 'adr')
		expect(getPropertyValue(adr)).toEqual(['', '', 'Main Street', 'City', '', '', ''])
	})
})

describe('mergeContacts - isPropertyEmpty / isPropertyListEmpty', () => {
	test('an absent property is empty', () => {
		expect(isPropertyEmpty(undefined)).toBe(true)
		expect(isPropertyEmpty(null)).toBe(true)
	})

	test('an empty structured property (ADR:;;;;;;) is empty', () => {
		const [adr] = propertiesOf(['ADR;TYPE=HOME:;;;;;;'], 'adr')
		expect(isPropertyEmpty(adr)).toBe(true)
	})

	test('an empty multi-value property (CATEGORIES:) is empty', () => {
		const [categories] = propertiesOf(['CATEGORIES:'], 'categories')
		expect(isPropertyEmpty(categories)).toBe(true)
	})

	test('a filled property is not empty', () => {
		const [fn] = propertiesOf(['FN:John'], 'fn')
		expect(isPropertyEmpty(fn)).toBe(false)
		const [adr] = propertiesOf(['ADR;TYPE=HOME:;;Main Street;;;;'], 'adr')
		expect(isPropertyEmpty(adr)).toBe(false)
	})

	test('an empty or missing list counts as empty', () => {
		expect(isPropertyListEmpty([])).toBe(true)
		expect(isPropertyListEmpty(undefined)).toBe(true)
		expect(isPropertyListEmpty(propertiesOf(['ADR;TYPE=HOME:;;;;;;'], 'adr'))).toBe(true)
	})

	test('a list with at least one filled property is not empty', () => {
		expect(isPropertyListEmpty(propertiesOf(['FN:John'], 'fn'))).toBe(false)
	})
})

describe('mergeContacts - comparePropertyLists', () => {
	test('identical single values are equal', () => {
		expect(comparePropertyLists(
			propertiesOf(['FN:John'], 'fn'),
			propertiesOf(['FN:John'], 'fn'),
		)).toBe('equal')
	})

	test('identical nicknames are equal (regression: phantom conflict)', () => {
		expect(comparePropertyLists(
			propertiesOf(['NICKNAME:nick'], 'nickname'),
			propertiesOf(['NICKNAME:nick'], 'nickname'),
		)).toBe('equal')
	})

	test('identical phone numbers are equal', () => {
		expect(comparePropertyLists(
			propertiesOf(['TEL;TYPE=CELL:+49 211 91378708'], 'tel'),
			propertiesOf(['TEL;TYPE=CELL:+49 211 91378708'], 'tel'),
		)).toBe('equal')
	})

	test('different values conflict', () => {
		expect(comparePropertyLists(
			propertiesOf(['FN:John'], 'fn'),
			propertiesOf(['FN:Jane'], 'fn'),
		)).toBe('conflict')
	})

	test('different nicknames conflict', () => {
		expect(comparePropertyLists(
			propertiesOf(['NICKNAME:nickA'], 'nickname'),
			propertiesOf(['NICKNAME:nickB'], 'nickname'),
		)).toBe('conflict')
	})

	test('a value present only in the first contact', () => {
		expect(comparePropertyLists(
			propertiesOf(['NICKNAME:nick'], 'nickname'),
			propertiesOf([], 'nickname'),
		)).toBe('onlyInFirst')
	})

	test('a value present only in the second contact', () => {
		expect(comparePropertyLists(
			propertiesOf([], 'title'),
			propertiesOf(['TITLE:Dr'], 'title'),
		)).toBe('onlyInSecond')
	})

	test('an empty value on one side is treated as "only in" the other', () => {
		// An empty ADR on one side should not count as a real value.
		expect(comparePropertyLists(
			propertiesOf(['ADR;TYPE=HOME:;;;;;;'], 'adr'),
			propertiesOf(['ADR;TYPE=HOME:;;Main Street;City;;;'], 'adr'),
		)).toBe('onlyInSecond')
	})
})
