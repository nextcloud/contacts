angular.module('contactsApp')
.controller('grouplistCtrl', function($scope, ContactService, SearchService, $routeParams) {
	var ctrl = this;

	ctrl.groups = [];

	ContactService.getGroupList().then(function(groups) {
		ctrl.groups = groups;
	});

	ctrl.getSelected = function() {
		return $routeParams.gid;
	};

	// Update groupList on contact add/delete/update
	ContactService.registerObserverCallback(function(ev) {
		if (ev.event !== 'getFullContacts') {
			$scope.$apply(function() {
				ContactService.getGroupList().then(function(groups) {
					ctrl.groups = groups;
				});
			});
		}
	});

	ctrl.setSelected = function (selectedGroup) {
		SearchService.cleanSearch();
		$routeParams.gid = selectedGroup;
	};
});
