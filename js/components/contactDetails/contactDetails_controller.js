app.controller('contactdetailsCtrl', ['ContactService', function(ContactService) {
	var ctrl = this;

	ctrl.updateContact = function() {
		ContactService.update(ctrl.contact);
		console.log('updating Contact');
	};

	ctrl.deleteContact = function() {
		ContactService.delete(ctrl.contact.data);
		console.log('Deleting Contact');
	};
}]);
