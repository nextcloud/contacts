describe('localeOrderBy filter', function() {

	var $filter;

	beforeEach(module('contactsApp'));

	beforeEach(inject(function(_$filter_){
		$filter = _$filter_;
	}));

	it('should return the array properly sorted', function() {
		var localeOrderBy = $filter('localeOrderBy');
		var sorted = $filter('localeOrderBy')(
			[
				{name:'Mb'},
				{name:'Mab'},
				{name:'Máa'},
				{name: 1},
				{name: undefined},
				{name: undefined}
			],
			'name',
			false
		);
		var expected = [
			{name: 1},
			{name:'Máa'},
			{name:'Mab'},
			{name:'Mb'},
			{name: undefined},
			{name: undefined}
		];
		expect(sorted).to.deep.equal(expected);
	});

	it('should return the array properly sorted by uid if the name are all equals', function() {
		var localeOrderBy = $filter('localeOrderBy');
		var sorted = $filter('localeOrderBy')(
			[
				{name:'Test',	uid: '4321'},
				{name:'Test',	uid: '1234'},
				{name:'Test2',	uid: '0000'},
				{name: 1,		uid: '5241'}
			],
			['name', 'uid'],
			false
		);
		var expected = [
			{name: 1,		uid: '5241'},
			{name:'Test',	uid: '1234'},
			{name:'Test',	uid: '4321'},
			{name:'Test2',	uid: '0000'}
		];
		expect(sorted).to.deep.equal(expected);
	});

	it('should return the array properly sorted by firstName, lastName then uid', function() {
		var localeOrderBy = $filter('localeOrderBy');
		var sorted = $filter('localeOrderBy')(
			[
				{firstName:'John',	lastName: 'Doe',	uid: 2525},
				{firstName:'Molly',	lastName: 'Holly',	uid: 8731},
				{firstName:'Hans',	lastName: 'Maeven',	uid: 0563},
				{firstName:'John',	lastName: 'Dorian',	uid: 2683},
				{firstName:'John',	lastName: 'Doe',	uid: 1624},
				{firstName:'John',	lastName: '',		uid: 9338}
			],
			['firstName', 'lastName', 'uid'],
			false
		);
		var expected = [
			{firstName:'Hans',	lastName: 'Maeven',	uid: 0563},
			{firstName:'John',	lastName: '',		uid: 9338},
			{firstName:'John',	lastName: 'Doe',	uid: 1624},
			{firstName:'John',	lastName: 'Doe',	uid: 2525},
			{firstName:'John',	lastName: 'Dorian',	uid: 2683},
			{firstName:'Molly',	lastName: 'Holly',	uid: 8731}
		];
		expect(sorted).to.deep.equal(expected);
	});

	it('should return the array properly sorted by firstName, lastName then the uid function', function() {
		var localeOrderBy = $filter('localeOrderBy');
		var returnInt = function() {return 1234};
		var sorted = $filter('localeOrderBy')(
			[
				{firstName:'John',	lastName: 'Doe',	uid: returnInt},
				{firstName:'John',	lastName: 'Doe',	uid: returnInt},
				{firstName:'John',	lastName: '',		uid: returnInt}
			],
			['firstName', 'lastName', 'uid'],
			false
		);
		var expected = [
			{firstName:'John',	lastName: '',		uid: returnInt},
			{firstName:'John',	lastName: 'Doe',	uid: returnInt},
			{firstName:'John',	lastName: 'Doe',	uid: returnInt}
		];
		expect(sorted).to.deep.equal(expected);
	});
});
