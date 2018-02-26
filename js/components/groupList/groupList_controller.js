angular.module('contactsApp')
.controller('grouplistCtrl', function($scope, $timeout, ContactService, SearchService, $routeParams) {
	var ctrl = this;

	ctrl.groups = [];
	ctrl.contactFilters = [];

	ContactService.getGroupList().then(function(groups) {
		ctrl.groups = groups;
	});

	ContactService.getContactFilters().then(function(contactFilters) {
		ctrl.contactFilters = contactFilters;
	});

	ctrl.getSelected = function() {
		return $routeParams.gid;
	};

	// Update groupList on contact add/delete/update/groupsUpdate
	ContactService.registerObserverCallback(function(ev) {
		if (ev.event !== 'getFullContacts') {
			$timeout(function () {
				$scope.$apply(function() {
					ContactService.getGroupList().then(function(groups) {
						ctrl.groups = groups;
					});
					ContactService.getContactFilters().then(function(contactFilters) {
						ctrl.contactFilters = contactFilters;
					});
				});
			});
		}
	});

	ctrl.setSelected = function (selectedGroup) {
		SearchService.cleanSearch();
		$routeParams.gid = selectedGroup;
	};
});
