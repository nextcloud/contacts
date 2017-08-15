angular.module('contactsApp')
.directive('contactimport', function(ContactService, ImportService, $rootScope) {
	return {
		link: function(scope, element, attrs, ctrl) {
			var input = element.find('input');
			input.bind('change', function() {
				angular.forEach(input.get(0).files, function(file) {
					var reader = new FileReader();

					reader.addEventListener('load', function () {
						scope.$apply(function () {
							// Indicate the user we started something
							ctrl.importText = ctrl.t.importingText;
							ctrl.loadingClass = 'icon-loading-small';
							ctrl.importing = true;
							$rootScope.importing = true;

							ContactService.import.call(ContactService, reader.result, file.type, ctrl.selectedAddressBook, function (progress, user) {
								if (progress === 1) {
									ctrl.importText = ctrl.t.importText;
									ctrl.loadingClass = 'icon-upload';
									ctrl.importing = false;
									$rootScope.importing = false;
									ImportService.importPercent = 0;
									ImportService.importing = false;
									ImportService.importedUser = '';
									ImportService.selectedAddressBook = '';
								} else {
									// Ugly hack, hide sidebar on import & mobile
									// Simulate click since we can't directly access snapper
									if($(window).width() <= 768 && $('body').hasClass('snapjs-left')) {
										$('#app-navigation-toggle').click();
										$('body').removeClass('snapjs-left');
									}

									ImportService.importPercent = parseInt(Math.floor(progress * 100));
									ImportService.importing = true;
									ImportService.importedUser = user;
									ImportService.selectedAddressBook = ctrl.selectedAddressBook.displayName;
								}
								scope.$apply();

								/* Broadcast service update */
								$rootScope.$broadcast('importing', true);
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
