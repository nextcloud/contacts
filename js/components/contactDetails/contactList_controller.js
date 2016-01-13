app.controller('contactdetailsCtrl', ['ContactService', function(ContactService) {
	var ctrl = this;

	ctrl.deleteContact = function() {
		ContactService.delete(ctrl.contact.data);
		console.log('Deleting Contact');
	};
}]);
