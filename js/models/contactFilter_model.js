angular.module('contactsApp')
	.factory('ContactFilter', function()
	{
		return function ContactFilter(data) {
			angular.extend(this, {
				name: '',
				count: 0
			});

			angular.extend(this, data);
		};
	});
