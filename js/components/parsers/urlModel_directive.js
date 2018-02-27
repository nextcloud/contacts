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
				var searchFtpHttps = new RegExp('^(ht|f)tps?:\/\/');
				if (searchFtpHttps.test(value)) {
					return value;
				}
				var searchFtpHttpsNoSlashes = new RegExp('^((ht|f)tps?:)');
				if (searchFtpHttpsNoSlashes.test(value)) {
					return value.replace(searchFtpHttpsNoSlashes, '$1//');
				}
				return 'https://' + value;
			});
			ngModel.$parsers.push(function(value) {
				var searchFtpHttps = new RegExp('^(ht|f)tps?:\/\/');
				if (searchFtpHttps.test(value)) {
					return value;
				}
				var searchFtpHttpsNoSlashes = new RegExp('^((ht|f)tps?:)');
				if (searchFtpHttpsNoSlashes.test(value)) {
					return value.replace(searchFtpHttpsNoSlashes, '$1//');
				}
				return 'https://' + value;
			});
		}
	};
});
