angular.module('contactsApp')
.directive('contactimport', function(ContactService) {
	return {
		scope: {},
		link: function(scope, element) {
			element.bind('change', function() {
				var file = element.get(0).files[0];
				var reader = new FileReader();

				reader.addEventListener('load', function () {
					scope.$apply(function() {
						ContactService.import.call(ContactService, reader.result, file.type);
					});
				}, false);

				if (file) {
					reader.readAsText(file);
				}
			});
		}
	};
});
