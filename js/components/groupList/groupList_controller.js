app.controller('grouplistCtrl', function($scope, ContactService, SearchService, $routeParams) {

	$scope.groups = [t('contacts', 'All contacts'), t('contacts', 'Not grouped')];

	ContactService.getGroups().then(function(groups) {
		$scope.groups = _.unique([t('contacts', 'All contacts'), t('contacts', 'Not grouped')].concat(groups));
	});

	$scope.selectedGroup = $routeParams.gid;
	$scope.setSelected = function (selectedGroup) {
		SearchService.cleanSearch();
		$scope.selectedGroup = selectedGroup;
	};
});
