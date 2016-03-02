app.controller('contactdetailsCtrl', ['ContactService', 'vCardPropertiesService', '$routeParams', '$scope', function(ContactService, vCardPropertiesService, $routeParams, $scope) {
	var ctrl = this;

	ctrl.uid = $routeParams.uid;
	ctrl.t = {
		noContacts : t('contacts', 'No contacts in here'),
		placeholderName : t('contacts', 'Name'),
		selectField : t('contacts', 'Add field ...')
	};

	ctrl.fieldDefinitions = vCardPropertiesService.fieldDefinitions;
	ctrl.focus = undefined;

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
	};

	ctrl.deleteContact = function() {
		ContactService.delete(ctrl.contact);
	};

	ctrl.addField = function(field) {
		ctrl.contact.setProperty(field, {value: ''});
		ctrl.singleProperties = ctrl.contact.getSingleProperties();
		ctrl.focus = field;
	};
}]);
