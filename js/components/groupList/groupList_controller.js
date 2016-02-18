app.controller('grouplistCtrl', ['$scope', 'ContactService', '$routeParams', function($scope, ContactService, $routeParams) {

	$scope.groups = ['All'];

	ContactService.getGroups().then(function(groups) {
		$scope.groups = groups;
	});

	$scope.selectedGroup = $routeParams.gid;
	$scope.setSelected = function (selectedGroup) {
		$scope.selectedGroup = selectedGroup;
	};
}]);
