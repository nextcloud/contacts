app.controller('contactlistCtrl', ['$scope', 'ContactService', 'Contact', function($scope, ContactService, Contact) {
	var ctrl = this;

	ContactService.getAll().then(function(contacts) {
		$scope.$apply(function(){
			ctrl.contacts = contacts;
		});
	});

	ctrl.createContact = function() {
		ContactService.create();
	}
}]);
