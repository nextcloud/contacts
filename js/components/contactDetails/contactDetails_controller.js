angular.module('contactsApp')
.controller('contactdetailsCtrl', function(ContactService, AddressBookService, vCardPropertiesService, $route, $routeParams, $scope) {

	var ctrl = this;

	ctrl.loading = true;
	ctrl.show = false;

	ctrl.clearContact = function() {
		$route.updateParams({
			gid: $routeParams.gid,
			uid: undefined
		});
		ctrl.show = false;
		ctrl.contact = undefined;
	};

	ctrl.uid = $routeParams.uid;
	ctrl.t = {
		noContacts : t('contacts', 'No contacts in here'),
		placeholderName : t('contacts', 'Name'),
		placeholderOrg : t('contacts', 'Organization'),
		placeholderTitle : t('contacts', 'Title'),
		selectField : t('contacts', 'Add field ...'),
		download : t('contacts', 'Download'),
		delete : t('contacts', 'Delete')
	};

	ctrl.fieldDefinitions = vCardPropertiesService.fieldDefinitions;
	ctrl.focus = undefined;
	ctrl.field = undefined;
	ctrl.addressBooks = [];

	AddressBookService.getAll().then(function(addressBooks) {
		ctrl.addressBooks = addressBooks;

		if (!_.isUndefined(ctrl.contact)) {
			ctrl.addressBook = _.find(ctrl.addressBooks, function(book) {
				return book.displayName === ctrl.contact.addressBookId;
			});
		}
		ctrl.loading = false;
	});

	$scope.$watch('ctrl.uid', function(newValue) {
		ctrl.changeContact(newValue);
	});

	ctrl.changeContact = function(uid) {
		if (typeof uid === 'undefined') {
			ctrl.show = false;
			$('#app-navigation-toggle').removeClass('showdetails');
			return;
		}
		ContactService.getById(uid).then(function(contact) {
			if (angular.isUndefined(contact)) {
				ctrl.clearContact();
				return;
			}
			ctrl.contact = contact;
			ctrl.show = true;
			$('#app-navigation-toggle').addClass('showdetails');

			ctrl.addressBook = _.find(ctrl.addressBooks, function(book) {
				return book.displayName === ctrl.contact.addressBookId;
			});
		});
	};

	ctrl.updateContact = function() {
		ContactService.update(ctrl.contact);
	};

	ctrl.deleteContact = function() {
		ContactService.delete(ctrl.contact);
	};

	ctrl.addField = function(field) {
		var defaultValue = vCardPropertiesService.getMeta(field).defaultValue || {value: ''};
		ctrl.contact.addProperty(field, defaultValue);
		ctrl.focus = field;
		ctrl.field = '';
	};

	ctrl.deleteField = function (field, prop) {
		ctrl.contact.removeProperty(field, prop);
		ctrl.focus = undefined;
	};

	ctrl.changeAddressBook = function (addressBook) {
		ContactService.moveContact(ctrl.contact, addressBook);
	};
});
