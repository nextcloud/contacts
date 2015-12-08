app.controller('contactlistCtrl', ['ContactService', function(ContactService) {
	var ctrl = this;

	ctrl.contacts = ContactService.getAll();
}]);
