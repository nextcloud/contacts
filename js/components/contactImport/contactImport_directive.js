angular.module('contactsApp')
.directive('contactimport', function(ContactService) {
	return {
		link: function(scope, element) {
			var importText = t('contacts', 'Import');
			scope.importText = importText;

			var input = element.find('input');
			input.bind('change', function() {
				var file = input.get(0).files[0];
				var reader = new FileReader();

				reader.addEventListener('load', function () {
					scope.$apply(function() {
						ContactService.import.call(ContactService, reader.result, file.type, null, function(progress) {
							if(progress===1) {
								scope.importText = importText;
							} else {
								scope.importText = parseInt(Math.floor(progress*100))+'%';
							}
						});
					});
				}, false);

				if (file) {
					reader.readAsText(file);
				}
				input.get(0).value = '';
			});
		},
		templateUrl: OC.linkTo('contacts', 'templates/contactImport.html')
	};
});
