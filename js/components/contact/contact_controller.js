app.controller('contactCtrl', ['Contact', function(Contact) {
	var ctrl = this;

	ctrl.contact = new Contact(ctrl.data);

	console.log("Contact: ",ctrl.contact);

}]);