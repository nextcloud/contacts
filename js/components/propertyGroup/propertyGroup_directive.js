angular.module('contactsApp')
.directive('propertygroup', function() {
	return {
		scope: {},
		controller: 'propertyGroupCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			properties: '=data',
			name: '='
		},
		templateUrl: OC.linkTo('contacts', 'templates/propertyGroup.html')
	};
});
