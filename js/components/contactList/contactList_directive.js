app.directive('contactlist', function() {
	return {
		priority: 1,
		scope: {},
		controller: 'contactlistCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			addressbook: '='
		},
		templateUrl: OC.linkTo('contactsrework', 'templates/contactList.html')
	};
});