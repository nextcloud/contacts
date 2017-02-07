describe('sortbyService', function() {

	var $Service;
	beforeEach(module('contactsApp'));

	beforeEach(inject(function(SortByService){
		$Service = SortByService;
	}));

	it('should return sortDisplayName as default sorting method', function() {
		expect($Service.getSortBy()).to.equal('sortDisplayName');
	});

	it('should store sorting method', function() {
		$Service.setSortBy('sortLastName');
		expect($Service.getSortBy()).to.equal(
			window.localStorage.getItem('contacts_default_order')
		);
	});
});
