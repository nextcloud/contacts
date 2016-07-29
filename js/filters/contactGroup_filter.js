angular.module('contactsApp')
.filter('contactGroupFilter', function() {
	'use strict';
	return function (contacts, group) {
		if (typeof contacts === 'undefined') {
			return contacts;
		}
		if (typeof group === 'undefined' || group.toLowerCase() === t('contacts', 'All contacts').toLowerCase()) {
			return contacts;
		}
		var filter = [];
		if (contacts.length > 0) {
			for (var i = 0; i < contacts.length; i++) {
				if (group.toLowerCase() === t('contacts', 'Not grouped').toLowerCase()) {
					if (contacts[i].categories().length === 0) {
						filter.push(contacts[i]);
					}
				} else {
					if (contacts[i].categories().indexOf(group) >= 0) {
						filter.push(contacts[i]);
					}
				}
			}
		}
		return filter;
	};
});
