angular.module('contactsApp')
.directive('contactimport', function(ContactService) {
	return {
		scope: {},
		link: function(scope, element) {
			var input = element.find('input');
			input.bind('change', function() {
				var file = input.get(0).files[0];
				var reader = new FileReader();

				reader.addEventListener('load', function () {
					scope.$apply(function() {
						ContactService.import.call(ContactService, reader.result, file.type, null, function(progress) {
							element.find('label').text(progress);
						});
					});
				}, false);

				if (file) {
					reader.readAsText(file);
				}
			});
		},
		templateUrl: OC.linkTo('contacts', 'templates/contactImport.html')
	};
});
