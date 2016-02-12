app.controller('grouplistCtrl', ['$scope', 'ContactService', function($scope, ContactService) {

	$scope.groups = [];

	ContactService.getGroups().then(function(groups) {
		$scope.groups = groups;
	});

}]);
