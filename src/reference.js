import { registerWidget, registerCustomPickerElement, NcCustomPickerRenderResult } from '@nextcloud/vue/dist/Components/NcRichText.js'

registerWidget('users_picker_profile', async (el, { richObjectType, richObject, accessible }) => {
	const { default: Vue } = await import('vue')
	const { default: ProfilePickerReferenceWidget } = await import('./components/ProfilePicker/ProfilePickerReferenceWidget.vue')
	Vue.mixin({ methods: { t, n } })
	const Widget = Vue.extend(ProfilePickerReferenceWidget)
	new Widget({
		propsData: {
			richObjectType,
			richObject,
			accessible,
		},
	}).$mount(el)
}, () => {}, { hasInteractiveView: false })

registerCustomPickerElement('profile_picker', async (el, { providerId, accessible }) => {
	const { default: Vue } = await import(/* webpackChunkName: "vue-lazy" */'vue')
	Vue.mixin({ methods: { t, n } })
	const { default: ProfilesCustomPicker } = await import('./components/ProfilePicker/ProfilesCustomPicker.vue')
	const Element = Vue.extend(ProfilesCustomPicker)
	const vueElement = new Element({
		propsData: {
			providerId,
			accessible,
		},
	}).$mount(el)
	return new NcCustomPickerRenderResult(vueElement.$el, vueElement)
}, (el, renderResult) => {
	console.debug('Profile custom picker destroy callback. el', el, 'renderResult:', renderResult)
	renderResult.object.$destroy()
}, 'normal')
