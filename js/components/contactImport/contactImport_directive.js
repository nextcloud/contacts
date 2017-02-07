angular.module('contactsApp')
.directive('contactimport', function(ContactService) {
	return {
		link: function(scope, element, attrs, ctrl) {
			var input = element.find('input');
			input.bind('change', function() {
				angular.forEach(input.get(0).files, function(file) {
					var reader = new FileReader();

					reader.addEventListener('load', function () {
						scope.$apply(function () {
							ContactService.import.call(ContactService, reader.result, file.type, ctrl.selectedAddressBook, function (progress) {
								if (progress === 1) {
									ctrl.importText = ctrl.t.importText;
								} else {
									ctrl.importText = parseInt(Math.floor(progress * 100)) + '%';
								}
							});
						});
					}, false);

					if (file) {
						reader.readAsText(file);
					}
				});
				input.get(0).value = '';
			});
		},
		templateUrl: OC.linkTo('contacts', 'templates/contactImport.html'),
		controller: 'contactimportCtrl',
		controllerAs: 'ctrl'
	};
});
