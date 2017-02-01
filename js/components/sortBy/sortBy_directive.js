angular.module('contactsApp')
.directive('sortby', function() {
	return {
		priority: 1,
		scope: {},
		controller: 'sortbyCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contacts', 'templates/sortBy.html')
	};
});
