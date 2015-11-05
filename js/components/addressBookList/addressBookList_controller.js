app.controller('addressbooklistCtrl', ['$scope', 'AddressBookService', function(scope, AddressBookService) {
	var ctrl = this;

	console.log(AddressBookService);
	AddressBookService.getAll().then(function(addressBooks) {
		scope.$apply(function() {
			ctrl.addressBooks = addressBooks;
		});
	});
}]);