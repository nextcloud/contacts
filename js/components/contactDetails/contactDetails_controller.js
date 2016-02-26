app.controller('contactdetailsCtrl', ['ContactService', 'vCardPropertiesService', '$routeParams', '$scope', function(ContactService, vCardPropertiesService, $routeParams, $scope) {
	var ctrl = this;

	ctrl.uid = $routeParams.uid;
	ctrl.t = {
		noContacts : t('contactsrework', 'No contacts in here'),
		placeholderName : t('contactsrework', 'Name')
	};

	ctrl.fieldDefinitions = vCardPropertiesService.fieldDefinitions;

	$scope.$watch('ctrl.uid', function(newValue, oldValue) {
		ctrl.changeContact(newValue);
	});

	ctrl.changeContact = function(uid) {
		if (typeof uid === "undefined") {
			return;
		}
		ContactService.getById(uid).then(function(contact) {
			ctrl.contact = contact;
			ctrl.singleProperties = ctrl.contact.getSingleProperties();
			ctrl.photo = ctrl.contact.photo();
		});
	};

	ctrl.updateContact = function() {
		ContactService.update(ctrl.contact);
		console.log('updating Contact');
	};

	ctrl.deleteContact = function() {
		ContactService.delete(ctrl.contact);
		console.log('Deleting Contact');
	};

	ctrl.addField = function(field) {
		ctrl.contact.setProperty(field, {value: ''});
		ctrl.singleProperties = ctrl.contact.getSingleProperties();
	}
}]);
