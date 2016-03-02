app.directive('focusExpression', function ($timeout) {
	return {
		restrict: 'A',
		link: {
			post: function postLink(scope, element, attrs) {
				scope.$watch(attrs.focusExpression, function (value) {

					if (attrs.focusExpression) {
						if (scope.$eval(attrs.focusExpression)) {
							$timeout(function () {
								element[0].focus();
							}, 100); //need some delay to work with ng-disabled
						}
					}
				});
			}
		}
	};
});
