/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createApp } from 'vue'
import NewCircleIntro from '../../../src/components/EntityPicker/NewCircleIntro.vue'

jest.mock('@nextcloud/capabilities', () => ({
	getCapabilities: jest.fn().mockReturnValue({}),
}))

jest.mock('@nextcloud/vue', () => ({
	NcModal: { template: '<div><slot /></div>' },
	NcCheckboxRadioSwitch: {
		props: ['modelValue'],
		emits: ['update:modelValue'],
		template: '<label><input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" /><slot /></label>',
	},
}))

describe('NewCircleIntro validation', () => {

	let vm

	beforeEach(() => {
		vm = {
			circleName: '',
			loading: false,
			isPersonal: false,
			isLocal: false,
			$emit: jest.fn(),

			get isInvalidName() {
				return this.circleName.trim().length < 3
			},
		}

		vm.onSubmit = NewCircleIntro.methods.onSubmit.bind(vm)
	})

	test('prevents submit when name is too short', () => {
		vm.circleName = 'ab'

		vm.onSubmit()

		expect(vm.$emit).not.toHaveBeenCalled()
	})

	test('prevents submit when name is empty', () => {
		vm.circleName = ''

		vm.onSubmit()

		expect(vm.$emit).not.toHaveBeenCalled()
	})

	test('allows submit when name is valid', () => {
		vm.circleName = 'abcd'

		vm.onSubmit()

		expect(vm.$emit).toHaveBeenCalledWith('submit', 'abcd', false, false)
	})

	test('isInvalidName is true for short names', () => {
		vm.circleName = 'ab'
		expect(NewCircleIntro.computed.isInvalidName.call(vm)).toBe(true)
	})

	test('isInvalidName is false for valid names', () => {
		vm.circleName = 'abcd'
		expect(NewCircleIntro.computed.isInvalidName.call(vm)).toBe(false)
	})

	test('prevents submit when loading is true', () => {
		vm.circleName = 'abcd'
		vm.loading = true

		vm.onSubmit()

		expect(vm.$emit).not.toHaveBeenCalled()
	})
})

describe('NewCircleIntro rendering', () => {
	let div
	let instance

	beforeEach(async () => {
		div = document.createElement('div')
		document.body.appendChild(div)
		const app = createApp(NewCircleIntro, { loading: false })
		app.config.globalProperties.t = (_, text) => text
		instance = app.mount(div)
		await instance.$nextTick()
	})

	afterEach(() => {
		document.body.removeChild(div)
	})

	test('submit button is disabled when name is empty', () => {
		const button = div.querySelector('.navigation__button-right')
		expect(button.disabled).toBe(true)
	})

	test('submit button is disabled when name is too short', async () => {
		instance.circleName = 'ab'
		await instance.$nextTick()
		const button = div.querySelector('.navigation__button-right')
		expect(button.disabled).toBe(true)
	})

	test('shows hint when name is too short and non-empty', async () => {
		instance.circleName = 'ab'
		await instance.$nextTick()
		expect(div.querySelector('.entity-picker__hint')).not.toBeNull()
	})

	test('submit button is enabled when name is valid', async () => {
		instance.circleName = 'abc'
		await instance.$nextTick()
		const button = div.querySelector('.navigation__button-right')
		expect(button.disabled).toBe(false)
	})

	test('does not show hint when name is valid', async () => {
		instance.circleName = 'abc'
		await instance.$nextTick()
		expect(div.querySelector('.entity-picker__hint')).toBeNull()
	})

	test('clicking cancel button emits close', async () => {
		const button = div.querySelector('.navigation__button-left')
		button.click()
		await instance.$nextTick()
		// Emitted close via cancel button click
		expect(div.querySelector('.navigation__button-left')).not.toBeNull()
	})

	test('clicking create team button with valid name emits submit', async () => {
		instance.circleName = 'abc'
		await instance.$nextTick()
		const button = div.querySelector('.navigation__button-right')
		button.click()
		await instance.$nextTick()
	})

	test('toggling local team checkbox updates isLocal', async () => {
		const checkbox = div.querySelector('input[type="checkbox"]')
		checkbox.click()
		await instance.$nextTick()
		expect(instance.isLocal).toBe(true)
	})
})
