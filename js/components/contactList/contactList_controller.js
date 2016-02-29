app.controller('contactlistCtrl', ['$scope', '$filter', '$route', '$routeParams', 'ContactService', function($scope, $filter, $route, $routeParams, ContactService) {
	var ctrl = this;

	ctrl.routeParams = $routeParams;
	ctrl.t = {
		addContact : t('contactsrework', 'Add contact')
	};

	ctrl.contactList = [];

	ContactService.registerObserverCallback(function(contacts) {
		$scope.$apply(function() {
			ctrl.contacts = contacts;
		});
	});

	ContactService.getAll().then(function(contacts) {
		$scope.$apply(function(){
			ctrl.contacts = contacts;
		});
	});

	$scope.$watch('ctrl.routeParams.uid', function(newValue) {
		if(newValue === undefined) {
			// we might have to wait until ng-repeat filled the contactList
			if(ctrl.contactList.length > 0) {
				$route.updateParams({
					gid: $routeParams.gid,
					uid: ctrl.contactList[0].uid()
				});
			} else {
				// watch for next contactList update
				var unbindWatch = $scope.$watch('ctrl.contactList', function(newValue) {
					$route.updateParams({
						gid: $routeParams.gid,
						uid: ctrl.contactList[0].uid()
					});
					unbindWatch(); // unbind as we only want one update
				});
			}
		}
	});

	ctrl.createContact = function() {
		ContactService.create();
	};

	ctrl.hasContacts = function () {
		if (!ctrl.contacts) {
			return false;
		}
		return ctrl.contacts.length > 0;
	};

	$scope.selectedContactId = $routeParams.uid;
	$scope.setSelected = function (selectedContactId) {
		$scope.selectedContactId = selectedContactId;
	};

}]);
