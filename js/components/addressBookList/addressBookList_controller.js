app.controller('addressbooklistCtrl', ['$scope', 'AddressBookService', 'settingsService', function(scope, AddressBookService) {
	var ctrl = this;

	console.log(AddressBookService);
	AddressBookService.getAll().then(function(addressBooks) {
		scope.$apply(function() {
			ctrl.addressBooks = addressBooks;
		});
	});

	ctrl.createAddressBook = function() {
		AddressBookService.create('newAddressBook');
	};

}]);
