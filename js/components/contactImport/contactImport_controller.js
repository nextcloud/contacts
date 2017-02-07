angular.module('contactsApp')
.controller('contactimportCtrl', function(ContactService, AddressBookService) {
	var ctrl = this;

	ctrl.t = {
		importText : t('contacts', 'Import'),
		selectAddressbook : t('contacts', 'Select your addressbook')
	};

	ctrl.import = ContactService.import.bind(ContactService);
	ctrl.loading = true;
	ctrl.importText = ctrl.t.importText;
	ctrl.selectedAddressBook = AddressBookService.getDefaultAddressBook();

	AddressBookService.getAll().then(function(addressBooks) {
		ctrl.addressBooks = addressBooks;
		ctrl.loading = false;
	});

});
