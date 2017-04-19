// from https://docs.nextcloud.com/server/11/developer_manual/app/css.html#menus
angular.module('contactsApp')
.filter('counterFormatter', function () {
	'use strict';
	return function (count) {
		if (count > 999) {
			return '999+';
		}
		return count;
	};
});

