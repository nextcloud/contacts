angular.module('contactsApp')
.service('SortByService', function () {
	var subscriptions = [];
	var sortBy = 'sortDisplayName';

	var defaultOrder = window.localStorage.getItem('contacts_default_order');
	if (defaultOrder) {
		sortBy = defaultOrder;
	}

	function notifyObservers () {
		angular.forEach(subscriptions, function (subscription) {
			if (typeof subscription === 'function') {
				subscription(sortBy);
			}
		});
	}

	return {
		subscribe: function (callback) {
			subscriptions.push (callback);
		},
		setSortBy: function (value) {
			sortBy = value;
			window.localStorage.setItem ('contacts_default_order', value);
			notifyObservers ();
		},
		getSortBy: function () {
			return sortBy;
		},
		getSortByList: function () {
			return {
				sortDisplayName: t('contacts', 'Display name'),
				sortFirstName: t('contacts', 'First name'),
				sortLastName: t('contacts', 'Last name')
			};
		}
	};
});
