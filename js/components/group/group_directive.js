angular.module('contactsApp')
.directive('group', function() {
	return {
		restrict: 'A', // has to be an attribute to work with core css
		scope: {},
		controller: 'groupCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			group: '=groupName',
			groupCount: '=groupCount'
		},
		templateUrl: OC.linkTo('contacts', 'templates/group.html')
	};
});
