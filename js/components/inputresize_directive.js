angular.module('contactsApp')
.directive('inputresize', function() {
	return {
		restrict: 'A',
		link : function (scope, element) {
			var elInput = element.val();
			element.bind('keydown keyup load focus', function() {
				elInput = element.val();
				// If set to 0, the min-width css data is ignored
				var length = elInput.length > 1 ? elInput.length : 1;
				element.attr('size', length);
			});
		}
	};
});
