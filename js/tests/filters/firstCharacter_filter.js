describe('firstCharacter filter', function() {

	var $filter;

	beforeEach(module('contactsApp'));

	beforeEach(inject(function(_$filter_){
		$filter = _$filter_;
	}));

	it('should return the first character', function() {
		var firstCharacter = $filter('firstCharacter');
		expect(firstCharacter('123')).to.equal('1');
		expect(firstCharacter('abc')).to.equal('a');
		expect(firstCharacter('A longer text than before which still works')).to.equal('A');
	});
});
