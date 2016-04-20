angular.module('contactsApp')
.controller('avataruploadCtrl', function(ContactService) {
	var ctrl = this;

	ctrl.import = ContactService.import.bind(ContactService);

});
