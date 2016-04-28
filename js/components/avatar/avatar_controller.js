angular.module('contactsApp')
.controller('avatarCtrl', function(ContactService) {
	var ctrl = this;

	ctrl.import = ContactService.import.bind(ContactService);

});
