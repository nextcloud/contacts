describe('localeOrderBy filter', function() {

	var $filter;

	beforeEach(module('contactsApp'));

	beforeEach(inject(function(_$filter_){
		$filter = _$filter_;
	}));

	it('should return the array properly sorted', function() {
		var localeOrderBy = $filter('localeOrderBy');
		var sorted = $filter('localeOrderBy')([{name:'Mb'}, {name:'Mab'}, {name:'Máa'}, {name: 1}, {name: undefined}, {name: undefined}], 'name', false);
		var expected = [{name: 1}, {name:'Máa'}, {name:'Mab'}, {name:'Mb'}, {name: undefined}, {name: undefined}];
		expect(sorted).to.deep.equal(expected);
	});
});
