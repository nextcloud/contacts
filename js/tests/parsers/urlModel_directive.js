describe('Unit testing url model', function() {
	var $compile,
		$rootScope,
		form;

	// Load the myApp module, which contains the directive
	beforeEach(module('contactsApp'));

	// Store references to $rootScope and $compile
	// so they are available to all tests in this describe block
	beforeEach(inject(function(_$compile_, _$rootScope_){
		// The injector unwraps the underscores (_) from around the parameter names when matching
		$compile = _$compile_;
		$rootScope = _$rootScope_;
		$scope = $rootScope;
		var element = angular.element(
			'<form name="form"><input url-model ng-model="model.url" name="url" /></form>'
		);
		$scope.model = { url: null };
		$compile(element)($scope);
		$scope.$digest();
		form = $scope.form;
	}));

	it('Add http protocol', function() {
		form.url.$setViewValue('3');
		expect($scope.model.url).to.equal('http://3');

		$scope.model.url = '3';
		expect(form.url.$modelValue).to.equal('http://3');
	});
	it('Don\'t add http protocol', function() {
		form.url.$setViewValue('http://owncloud.org');
		expect($scope.model.url).to.equal('http://owncloud.org');
		form.url.$setViewValue('https://owncloud.org');
		expect($scope.model.url).to.equal('https://owncloud.org');
	});
});
