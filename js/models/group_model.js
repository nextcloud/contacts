angular.module('contactsApp')
	.factory('Group', function()
	{
		return function Group(data) {
			angular.extend(this, {
				name: '',
				count: 0
			});

			angular.extend(this, data);
		};
	});
