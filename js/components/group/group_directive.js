app.directive('group', function() {
	return {
		restrict: 'A', // has to be an attribute to work with core css
		scope: {},
		controller: 'groupCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			group: "=data"
		},
		templateUrl: OC.linkTo('contactsrework', 'templates/group.html')
	};
});
