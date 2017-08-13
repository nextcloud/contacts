angular.module('contactsApp')
.controller('importscreenCtrl', function($scope, ImportService) {
	var ctrl = this;

	ctrl.t = {
		importingTo : t('contacts', 'Currently importing into'),
		importingText : t('contacts', 'Importing...'),
		selectAddressbook : t('contacts', 'Select your addressbook')
	};

	// Broadcast update
	$scope.$on('importing', function () {
		ctrl.selectedAddressBook = ImportService.selectedAddressBook;
		ctrl.importing = ImportService.importing;
		ctrl.importPercent = ImportService.importPercent;
	});

});
