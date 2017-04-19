angular.module('contactsApp')
.directive('selectExpression', function ($timeout) {
	return {
		restrict: 'A',
		link: {
			post: function postLink(scope, element, attrs) {
				scope.$watch(attrs.selectExpression, function () {
					if (attrs.selectExpression) {
						if (scope.$eval(attrs.selectExpression)) {
							$timeout(function () {
								if (element.is('input')) {
									element.select();
								} else {
									element.find('input').select();
								}
							}, 100); //need some delay to work with ng-disabled
						}
					}
				});
			}
		}
	};
});
