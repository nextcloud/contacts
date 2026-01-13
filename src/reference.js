/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { registerWidget, registerCustomPickerElement, NcCustomPickerRenderResult } from '@nextcloud/vue/components/NcRichText'

registerWidget('users_picker_profile', async (el, { richObjectType, richObject, accessible }) => {
	const { createApp } = await import('vue')
	const { default: ProfilePickerReferenceWidget } = await import('./components/ProfilePicker/ProfilePickerReferenceWidget.vue')

	const app = createApp(
		ProfilePickerReferenceWidget,
		{
			richObjectType,
			richObject,
			accessible,
		},
	)
	app.mixin({ methods: { t, n } })
	app.mount(el)
}, () => {}, { hasInteractiveView: false })

registerCustomPickerElement('profile_picker', async (el, { providerId, accessible }) => {
	const { createApp } = await import('vue')
	const { default: ProfilesCustomPicker } = await import('./components/ProfilePicker/ProfilesCustomPicker.vue')

	const app = createApp(
		ProfilesCustomPicker,
		{
			providerId,
			accessible,
		},
	)
	app.mixin({ methods: { t, n } })
	app.mount(el)

	return new NcCustomPickerRenderResult(el, app)
}, (el, renderResult) => {
	console.debug('Profile custom picker destroy callback. el', el, 'renderResult:', renderResult)
	renderResult.object.unmount()
}, 'normal')
