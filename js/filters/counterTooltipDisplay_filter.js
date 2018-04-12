angular.module('contactsApp')
.filter('counterTooltipDisplay', function () {
	'use strict';
	return function (count) {
		if (count > 9999) {
			return count;
		}
		return '';
	};
});


