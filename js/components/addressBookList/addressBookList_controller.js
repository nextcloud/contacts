angular.module('contactsApp')
.controller('addressbooklistCtrl', function($scope, AddressBookService) {
	var ctrl = this;

	ctrl.loading = true;
	ctrl.openedMenu = false;
	ctrl.addressBookRegex = /^[a-zA-Z0-9À-ÿ\s-_.!?#|()]+$/i;

	AddressBookService.getAll().then(function(addressBooks) {
		ctrl.addressBooks = addressBooks;
		ctrl.loading = false;
		if(ctrl.addressBooks.length === 0) {
			AddressBookService.create(t('contacts', 'Contacts')).then(function() {
				AddressBookService.getAddressBook(t('contacts', 'Contacts')).then(function(addressBook) {
					ctrl.addressBooks.push(addressBook);
					$scope.$apply();
				});
			});
		}
	});

	ctrl.t = {
		addressBookName : t('contacts', 'Address book name'),
		regexError : t('contacts', 'Only these special characters are allowed: -_.!?#|()')
	};

	ctrl.createAddressBook = function() {
		if(ctrl.newAddressBookName) {
			AddressBookService.create(ctrl.newAddressBookName).then(function() {
				AddressBookService.getAddressBook(ctrl.newAddressBookName).then(function(addressBook) {
					ctrl.addressBooks.push(addressBook);
					$scope.$apply();
				});
			}).catch(function() {
				OC.Notification.showTemporary(t('contacts', 'Address book could not be created.'));
			});
		}
	};
});
