app.controller('contactCtrl', ['$filter', function($filter) {
	var ctrl = this;

	console.log($filter('vCard2JSON')(ctrl.data.addressData));

}]);