app.controller('contactCtrl', ['$route', function($route) {
	var ctrl = this;

	ctrl.openContact = function() {
		$route.updateParams({uid: ctrl.contact.uid()});
	};

	console.log("Contact: ",ctrl.contact);

}]);
