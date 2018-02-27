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
		form.url.$setViewValue('parsers.nextcloud.com');
		expect($scope.model.url).to.equal('https://parsers.nextcloud.com');

		$scope.model.url = 'formatters.nextcloud.com';
		expect(form.url.$modelValue).to.equal('https://formatters.nextcloud.com');
	});
	it('Don\'t add http protocol', function() {
		form.url.$setViewValue('http://parsers.nextcloud.com');
		expect($scope.model.url).to.equal('http://parsers.nextcloud.com');
		form.url.$setViewValue('https://parsers.nextcloud.com');
		expect($scope.model.url).to.equal('https://parsers.nextcloud.com');

		$scope.model.url = 'http://formatters.nextcloud.com';
		expect(form.url.$modelValue).to.equal('http://formatters.nextcloud.com');
		$scope.model.url = 'https://formatters.nextcloud.com';
		expect(form.url.$modelValue).to.equal('https://formatters.nextcloud.com');
	});
	it('should recognize different protocols, apart from http(s)', function() {
		form.url.$setViewValue('ftp://parsers.nextcloud.com');
		expect($scope.model.url).to.equal('ftp://parsers.nextcloud.com');

		$scope.model.url = 'ftp://formatters.nextcloud.com';
		expect(form.url.$modelValue).to.equal('ftp://formatters.nextcloud.com');
	});
	it('should recognize protocols without using double slashes', function() {
		form.url.$setViewValue('ftp:parsers.nextcloud.com');
		expect($scope.model.url).to.equal('ftp://parsers.nextcloud.com');
		form.url.$setViewValue('http:parsers.nextcloud.com');
		expect($scope.model.url).to.equal('http://parsers.nextcloud.com');
		form.url.$setViewValue('https:parsers.nextcloud.com');
		expect($scope.model.url).to.equal('https://parsers.nextcloud.com');

		$scope.model.url = 'ftp:formatters.nextcloud.com';
		expect(form.url.$modelValue).to.equal('ftp://formatters.nextcloud.com');
		$scope.model.url = 'ftp:formatters.nextcloud.com';
		expect(form.url.$modelValue).to.equal('http://formatters.nextcloud.com');
		$scope.model.url = 'ftp:formatters.nextcloud.com';
		expect(form.url.$modelValue).to.equal('https://formatters.nextcloud.com');
	});
});
