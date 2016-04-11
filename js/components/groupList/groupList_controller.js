angular.module('contactsApp')
.controller('grouplistCtrl', function($scope, ContactService, SearchService, $routeParams) {
	var ctrl = this;

	var initialGroups = [t('contacts', 'All contacts'), t('contacts', 'Not grouped')];

	ctrl.groups = initialGroups;

	ContactService.getGroups().then(function(groups) {
		ctrl.groups = _.unique(initialGroups.concat(groups));
	});

	ctrl.getSelected = function() {
		return $routeParams.gid;
	};

	// Update groupList on contact add/delete/update
	ContactService.registerObserverCallback(function() {
		$scope.$apply(function() {
			ContactService.getGroups().then(function(groups) {
				ctrl.groups = _.unique(initialGroups.concat(groups));
			});
		});
	});

	ctrl.setSelected = function (selectedGroup) {
		SearchService.cleanSearch();
		$routeParams.gid = selectedGroup;
	};
});
