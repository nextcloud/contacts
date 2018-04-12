describe('counterTooltipDisplay filter', function() {

	var $filter;

	beforeEach(module('contactsApp'));

	beforeEach(inject(function(_$filter_){
		$filter = _$filter_;
	}));

	it('should return the empty string if less than 10000 and the actual number if greater than 9999', function() {
        var counterTooltipDisplay = $filter('counterTooltipDisplay');
        expect(counterTooltipDisplay(Number.NaN)).to.equal('');
        expect(counterTooltipDisplay(15)).to.equal('');
		expect(counterTooltipDisplay(0)).to.equal('');
		expect(counterTooltipDisplay(-5)).to.equal('');
		expect(counterTooltipDisplay(9999)).to.equal('');
		expect(counterTooltipDisplay(10000)).to.equal(10000);
	});
});