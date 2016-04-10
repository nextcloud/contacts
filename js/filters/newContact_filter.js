angular.module('contactsApp')
.filter('newContact', function() {
	return function(input) {
		return input !== '' ? input : t('contacts', 'New contact');
	};
});
