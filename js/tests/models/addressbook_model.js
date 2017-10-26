describe('addressbook model', function() {

	var $AddressBook;
	beforeEach(module('contactsApp'));

	beforeEach(inject(function(AddressBook){
		$AddressBook = AddressBook;
	}));

	it('should read the owner from input', function() {
		var exampleData = {
			data: {
				props: {
					owner: '/remote.php/dav/principals/users/username/'
				}
			}
		};
		var addressbook = new $AddressBook(exampleData);
		expect(addressbook.owner).to.equal('username');
	});

	it('should read shared user from input', function() {
		var exampleData = {
			data: {
				props: {
					owner: '/remote.php/dav/principals/users/username/',
					invite: [
						{
							access: { readWrite: '' },
							href: 'principal:principals/users/shared_username',
							commonName: 'shared_username'
						}
					]
				}
			}
		};
		var addressbook = new $AddressBook(exampleData);
		expect(addressbook.sharedWith.users.length).to.equal(1);
		expect(addressbook.sharedWith.users[0].id).to.equal('shared_username');
		expect(addressbook.sharedWith.users[0].displayname).to.equal('shared_username');
		expect(addressbook.sharedWith.users[0].writable).to.equal(true);
	});

	it('should read shared group from input', function() {
		var exampleData = {
			data: {
				props: {
					owner: '/remote.php/dav/principals/users/username/',
					invite: [
						{
							access: { readWrite: '' },
							href: 'principal:principals/groups/groupname',
							commonName: 'groupname'
						}
					]
				}
			}
		};
		var addressbook = new $AddressBook(exampleData);
		expect(addressbook.sharedWith.groups.length).to.equal(1);
		expect(addressbook.sharedWith.groups[0].id).to.equal('groupname');
		expect(addressbook.sharedWith.groups[0].displayname).to.equal('groupname');
		expect(addressbook.sharedWith.groups[0].writable).to.equal(true);
	});

	it('should skip shares without access', function() {
		var exampleData = {
			data: {
				props: {
					owner: '/remote.php/dav/principals/users/username/',
					invite: [
						{
							access: '',
							href: 'principal:principals/users/username',
							commonName: 'username'
						}
					]
				}
			}
		};
		var addressbook = new $AddressBook(exampleData);
		expect(addressbook.sharedWith.users.length).to.equal(0);
	});

	it('should skip shares without href', function() {
		var exampleData = {
			data: {
				props: {
					owner: '/remote.php/dav/principals/users/username/',
					invite: [
						{
							access: { read: '' },
							href: '',
							commonName: 'username'
						}
					]
				}
			}
		};
		var addressbook = new $AddressBook(exampleData);
		expect(addressbook.sharedWith.users.length).to.equal(0);
	});

});
