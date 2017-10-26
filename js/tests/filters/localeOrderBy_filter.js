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
				{name:'Test', uid: '4321'},
				{name:'Test', uid: '1234'},
				{name:'Test2', uid: '0000'},
				{name: 1, uid: '5241'}
			],
			['name', 'uid'],
			false
		);
		var expected = [
			{name: 1, uid: '5241'},
			{name:'Test', uid: '1234'},
			{name:'Test', uid: '4321'},
			{name:'Test2', uid: '0000'}
		];
		expect(sorted).to.deep.equal(expected);
	});

	it('should return the array properly sorted by uid even if both first and last name are equals', function() {
		var localeOrderBy = $filter('localeOrderBy');
		var sorted = $filter('localeOrderBy')(
			[
				{name:['New contact', 'New contact'], uid: '3456'},
				{name:['New contact', 'New contact'], uid: '1234'},
				{name:['New contact', 'New contact'], uid: '2345'},
				{name:['New contact', 'New contact'], uid: '0123'}
			],
			['name', 'uid'],
			false
		);
		var expected = [
			{name:['New contact', 'New contact'], uid: '0123'},
			{name:['New contact', 'New contact'], uid: '1234'},
			{name:['New contact', 'New contact'], uid: '2345'},
			{name:['New contact', 'New contact'], uid: '3456'}
		];
		expect(sorted).to.deep.equal(expected);
	});
});
