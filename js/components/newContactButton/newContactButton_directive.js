angular.module('contactsApp')
.directive('newcontactbutton', function() {
	return {
		restrict: 'EA', // has to be an attribute to work with core css
		scope: {},
		controller: 'newContactButtonCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contacts', 'templates/newContactButton.html')
	};
});
