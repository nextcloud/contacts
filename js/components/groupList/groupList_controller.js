app.controller('grouplistCtrl', ['$scope', 'ContactService', function($scope, ContactService) {

	$scope.groups = [];

	ContactService.getGroups().then(function(groups) {
		$scope.groups = groups;
	});

	$scope.selectedGroup = null;
	$scope.setSelected = function (selectedGroup) {
		$scope.selectedGroup = selectedGroup;
	};
}]);
