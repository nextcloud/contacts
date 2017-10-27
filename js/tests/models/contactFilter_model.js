describe('contactFilter model', function() {

	var $ContactFilter;
	beforeEach(module('contactsApp'));

	beforeEach(inject(function(ContactFilter){
		$ContactFilter = ContactFilter;
	}));

	it('should store passed json object', function() {
		var contactFilter = new $ContactFilter({name: 'test', count: 42});
		expect(contactFilter.name).to.equal('test');
		expect(contactFilter.count).to.equal(42);
	});

});
