app.directive('contactdetails', function() {
	return {
		priority: 1,
		scope: {},
		controller: 'contactdetailsCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contactsrework', 'templates/contactDetails.html')
	};
});
