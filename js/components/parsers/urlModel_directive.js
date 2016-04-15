angular.module('contactsApp')
.directive('urlModel', function() {
	return{
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, element, attr, ngModel) {
			ngModel.$formatters.push(function(value) {
				if (typeof value !== 'string') {
					return value;
				}
				if (!value.startsWith('http://') && !value.startsWith('https://')) {
					return 'http://' + value;
				}
				return value;
			});
			ngModel.$parsers.push(function(value) {
				if (!value.startsWith('http://') && !value.startsWith('https://')) {
					return 'http://' + value;
				}
				return value;
			});
		}
	};
});
