angular.module('contactsApp')
.controller('contactCtrl', function($route, $routeParams, SortByService) {
	var ctrl = this;

	ctrl.t = {
		errorMessage : t('contacts', 'This card is corrupted and has been fixed. Please check the data and trigger a save to make the changes permanent.'),
	};

	ctrl.getName = function() {
		// If lastName equals to firstName then none of them is set
		if (ctrl.contact.lastName() === ctrl.contact.firstName()) {
			return ctrl.contact.displayName();
		}

		if (SortByService.getSortByKey() === 'sortLastName') {
			return (
				ctrl.contact.lastName()
				+ (ctrl.contact.firstName() ? ', ' : '')
				+ ctrl.contact.firstName() + ' '
				+ ctrl.contact.additionalNames()
			).trim();
		}

		if (SortByService.getSortByKey() === 'sortFirstName') {
			return (
				ctrl.contact.firstName() + ' '
				+ ctrl.contact.additionalNames() + ' '
				+ ctrl.contact.lastName()
			).trim();
		}

		return ctrl.contact.displayName();
	};
});

