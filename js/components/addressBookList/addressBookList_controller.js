app.controller('addressbooklistCtrl', ['$scope', 'AddressBookService', 'SettingsService', function(scope, AddressBookService, SettingsService) {
	var ctrl = this;

	console.log(AddressBookService);
	AddressBookService.getAll().then(function(addressBooks) {
		ctrl.addressBooks = addressBooks;
	});

	ctrl.createAddressBook = function() {
		if(ctrl.newAddressBookName) {
			AddressBookService.create(ctrl.newAddressBookName);
		}
	};

}]);
