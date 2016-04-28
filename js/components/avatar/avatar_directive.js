angular.module('contactsApp')
.directive('avatar', function(ContactService) {
	return {
		scope: {
			contact: '=data'
		},
		link: function(scope, element) {
			var importText = t('contacts', 'Import');
			scope.importText = importText;

			var input = element.find('input');
			input.bind('change', function() {
				var file = input.get(0).files[0];
				var reader = new FileReader();

				reader.addEventListener('load', function () {
					scope.$apply(function() {
						scope.contact.photo(reader.result);
						ContactService.update(scope.contact);
					});
				}, false);

				if (file) {
					reader.readAsDataURL(file);
				}
			});
		},
		templateUrl: OC.linkTo('contacts', 'templates/avatar.html')
	};
});
