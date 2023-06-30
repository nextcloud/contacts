import { registerWidget, registerCustomPickerElement, NcCustomPickerRenderResult } from '@nextcloud/vue/dist/Components/NcRichText.js'
import { getRequestToken } from '@nextcloud/auth'

__webpack_nonce__ = btoa(getRequestToken()) // eslint-disable-line
__webpack_public_path__ = OC.linkTo('contacts', 'js/') // eslint-disable-line

registerWidget('users_picker_profile', async (el, { richObjectType, richObject, accessible }) => {
	const { default: Vue } = await import(/* webpackChunkName: "reference-issue-lazy" */'vue')
	const { default: ProfilePickerReferenceWidget } = await import(/* webpackChunkName: "reference-issue-lazy" */'./components/ProfilePicker/ProfilePickerReferenceWidget.vue')
	Vue.mixin({ methods: { t, n } })
	const Widget = Vue.extend(ProfilePickerReferenceWidget)
	new Widget({
		propsData: {
			richObjectType,
			richObject,
			accessible,
		},
	}).$mount(el)
})

registerCustomPickerElement('profile_picker', async (el, { providerId, accessible }) => {
	const { default: Vue } = await import(/* webpackChunkName: "vue-lazy" */'vue')
	Vue.mixin({ methods: { t, n } })
	const { default: ProfilesCustomPicker } = await import(/* webpackChunkName: "image-picker-lazy" */'./components/ProfilePicker/ProfilesCustomPicker.vue')
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
