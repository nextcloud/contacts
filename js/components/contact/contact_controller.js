app.controller('contactCtrl', ['Contact', function(Contact) {
	var ctrl = this;

	ctrl.contact = new Contact(ctrl.data);

	console.log(ctrl.contact);

}]);