angular.module('contactsApp')
.controller('contactimportCtrl', function(ContactService, AddressBookService) {
	var ctrl = this;

	ctrl.t = {
		importText : t('contacts', 'Import into'),
		selectAddressbook : t('contacts', 'Select your addressbook')
	};

	ctrl.import = ContactService.import.bind(ContactService);
	ctrl.loading = true;
	ctrl.importText = ctrl.t.importText;

	AddressBookService.getAll().then(function(addressBooks) {
		ctrl.addressBooks = addressBooks;
		ctrl.loading = false;
		ctrl.selectedAddressBook = AddressBookService.getDefaultAddressBook();
	});

	ctrl.stopHideMenu = function(isOpen) {
		if(isOpen) {
			// disabling settings bind
			$('#app-settings-header > button').data('apps-slide-toggle', false);
		} else {
			// reenabling it
			$('#app-settings-header > button').data('apps-slide-toggle', '#app-settings-content');
		}
	};

});
