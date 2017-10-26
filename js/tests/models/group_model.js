describe('groupModel', function() {

	var $Group;
	beforeEach(module('contactsApp'));

	beforeEach(inject(function(Contact){
		$Group = Group;
	}));

	it('should store passed json object', function() {
		var group = new $Group({name: 'test', count: 42});
		contact.title('The Boss');
		expect(group.name).to.equal('test');
		expect(group.count).to.equal(42);
	});

});
