angular.module('contactsApp')
.directive('datepicker', function($timeout) {
	var loadDatepicker = function (scope, element, attrs, ngModelCtrl) {
		$timeout(function() {
			element.datepicker({
				dateFormat:'yy-mm-dd',
				minDate: null,
				maxDate: null,
				constrainInput: false,
				onSelect:function (date, dp) {
					if (dp.selectedYear < 1000) {
						date = '0' + date;
					}
					if (dp.selectedYear < 100) {
						date = '0' + date;
					}
					if (dp.selectedYear < 10) {
						date = '0' + date;
					}
					ngModelCtrl.$setViewValue(date);
					scope.$apply();
				}
			});
		});
	};
	return {
		restrict: 'A',
		require : 'ngModel',
		transclude: true,
		link : loadDatepicker
	};
});
