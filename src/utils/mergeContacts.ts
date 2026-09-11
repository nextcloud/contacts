/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * The subset of the ICAL.Property API used when merging contacts.
 */
export interface MergeableProperty {
	isMultiValue: boolean
	isStructuredValue: boolean
	getValues(): unknown[]
	getFirstValue(): unknown
}

type MaybeProperty = MergeableProperty | null | undefined

/**
 * How the two lists of a given property differ between the merged contacts.
 */
export type ConflictType = 'onlyInSecond' | 'onlyInFirst' | 'equal' | 'conflict'

/**
 * Extract a comparable value from an ICAL property.
 *
 * Structured multi-value properties (e.g. ADR) return their first (array)
 * value, plain multi-value properties (e.g. NICKNAME) return the whole array
 * of values and single-value properties return their scalar value.
 *
 * @param property an ICAL.Property (or null/undefined)
 */
export function getPropertyValue(property: MaybeProperty): unknown {
	if (!property) {
		return null
	}
	if (property.isMultiValue) {
		// differences between values types :x;x;x;x;x and x,x,x,x,x
		return property.isStructuredValue
			? property.getValues()[0]
			: property.getValues()
	}
	return property.getFirstValue()
}

/**
 * Deeply compare two property values.
 *
 * getPropertyValue may return either a scalar or an array (structured or
 * multi-value property). Comparing arrays with `===` always yields false
 * since they are distinct references, which previously flagged identical
 * multi-value properties (e.g. NICKNAME) as conflicts. This compares by
 * value instead.
 *
 * @param a the first value
 * @param b the second value
 */
export function valuesEqual(a: unknown, b: unknown): boolean {
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((value, index) => valuesEqual(value, b[index]))
	}
	return a === b
}

/**
 * Whether a single property holds no meaningful value.
 *
 * @param property an ICAL.Property (or null/undefined)
 */
export function isPropertyEmpty(property: MaybeProperty): boolean {
	if (property === undefined || property === null) {
		return true
	}

	const value = getPropertyValue(property)

	if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
		return true
	}

	if (Array.isArray(value)) {
		return value.every((entry) => entry === '' || entry === undefined)
	}

	return false
}

/**
 * Whether every property in the list is empty. An empty or missing list
 * counts as empty.
 *
 * @param properties a list of ICAL.Property instances
 */
export function isPropertyListEmpty(properties: MaybeProperty[] | null | undefined): boolean {
	return (properties ?? []).every((property) => isPropertyEmpty(property))
}

/**
 * Classify how the two lists of a given property differ between contacts.
 *
 * @param propertiesA the property instances of the first contact
 * @param propertiesB the property instances of the second contact
 */
export function comparePropertyLists(
	propertiesA: MaybeProperty[] | null | undefined,
	propertiesB: MaybeProperty[] | null | undefined,
): ConflictType {
	if (isPropertyListEmpty(propertiesA)) {
		return 'onlyInSecond'
	}
	if (isPropertyListEmpty(propertiesB)) {
		return 'onlyInFirst'
	}

	const valuesA = (propertiesA ?? []).map(getPropertyValue)
	const valuesB = (propertiesB ?? []).map(getPropertyValue)

	if (valuesA.length === valuesB.length && valuesA.every((value, index) => valuesEqual(value, valuesB[index]))) {
		return 'equal'
	}

	return 'conflict'
}
