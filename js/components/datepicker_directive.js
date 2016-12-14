angular.module('contactsApp')
.directive('datepicker', function() {
	return {
		restrict: 'A',
		require : 'ngModel',
		link : function (scope, element, attrs, ngModelCtrl) {
			$(function() {
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
		}
	};
});
