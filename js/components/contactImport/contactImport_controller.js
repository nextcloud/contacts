angular.module('contactsApp')
.controller('contactimportCtrl', function(ContactService) {
	var ctrl = this;

	ctrl.import = ContactService.import.bind(ContactService);

});
