angular.module('contactsApp')
.directive('contactFilter', function() {
	return {
		restrict: 'A', // has to be an attribute to work with core css
		scope: {},
		controller: 'contactfilterCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			contactFilter: '=contactFilter'
		},
		templateUrl: OC.linkTo('contacts', 'templates/contactFilter.html')
	};
});
