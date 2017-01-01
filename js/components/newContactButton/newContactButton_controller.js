angular.module('contactsApp')
.controller('newContactButtonCtrl', function($scope, ContactService, $routeParams, vCardPropertiesService) {
	var ctrl = this;

	ctrl.t = {
		addContact : t('contacts', 'New contact')
	};

	ctrl.createContact = function() {
		ContactService.create().then(function(contact) {
			['tel', 'adr', 'email'].forEach(function(field) {
				var defaultValue = vCardPropertiesService.getMeta(field).defaultValue || {value: ''};
				contact.addProperty(field, defaultValue);
			} );
			if ([t('contacts', 'All contacts'), t('contacts', 'Not grouped')].indexOf($routeParams.gid) === -1) {
				contact.categories([ $routeParams.gid ]);
			} else {
				contact.categories([]);
			}
			$('#details-fullName').focus();
		});
	};
});
