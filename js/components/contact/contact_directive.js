app.directive('contact', function() {
	return {
		scope: {},
		controller: 'contactCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			data: '='
		},
		templateUrl: OC.linkTo('contactsrework', 'templates/contact.html')
	}
});