// from https://github.com/owncloud/contacts/blob/31e403af1db859f85e84c2337134e20e5719c825/js/tests/filters/counterFormatter_filter.js by @skjnldsv
describe('counterFormatter filter', function() {

	var $filter;

	beforeEach(module('contactsApp'));

	beforeEach(inject(function(_$filter_){
		$filter = _$filter_;
	}));

	it('should return the same number or 9999+ if greater than 9999', function() {
		var counterFormatter = $filter('counterFormatter');
		expect(counterFormatter(Number.NaN)).to.be.Nan;
		expect(counterFormatter(15)).to.equal(15);
		expect(counterFormatter(0)).to.equal('');
		expect(counterFormatter(-5)).to.equal(-5);
		expect(counterFormatter(9999)).to.equal(9999);
		expect(counterFormatter(10000)).to.equal('9999+');
	});
});
