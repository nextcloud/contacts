angular.module('contactsApp')
.directive('propertygroup', function() {
	return {
		scope: {},
		controller: 'propertyGroupCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			properties: '=data',
			name: '=',
			contact: '=model'
		},
		templateUrl: OC.linkTo('contacts', 'templates/propertyGroup.html'),
		link: function(scope, element, attrs, ctrl) {
			if(ctrl.isHidden()) {
				// TODO replace with class
				element.css('display', 'none');
			}
		}
	};
});
