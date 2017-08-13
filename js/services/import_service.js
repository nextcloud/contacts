angular.module('contactsApp')
.service('ImportService', function() {

	this.importing = false;
	this.selectedAddressBook = t('contacts', 'Import into');
	this.importPercent = 0;

	this.t = {
		importText : t('contacts', 'Import into'),
		importingText : t('contacts', 'Importing...')
	};

});
