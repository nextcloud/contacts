import Vue from 'vue'
import TeamsWidget from './components/TeamsWidget.vue'

console.log('Teams widget script loaded')

document.addEventListener('DOMContentLoaded', function() {
	console.log('Registering circles dashboard widget')
	
	OCA.Dashboard.register('circles', (el) => {
		console.log('Mounting circles widget to element:', el)
		const View = Vue.extend(TeamsWidget)
		const vm = new View().$mount(el)
	})
})
