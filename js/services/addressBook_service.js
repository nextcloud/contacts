app.service('AddressBookService', ['DavClient', 'DavService', 'AddressBook', 'Contact', function(DavClient, DavService, AddressBook, Contact){

	this.getAll = function() {
		return DavService.then(function(account) {
			return account.addressBooks.map(function(addressBook) {
				return new AddressBook(addressBook);
			});
		});
	};

	this.get = function(displayName) {
		return this.getAll().then(function(addressBooks){
			return addressBooks.filter(function (element) {
				return element.displayName === displayName;
			})[0];
		});
	};

	this.sync = function(addressBook) {
		console.log('hi');
		return DavClient.syncAddressBook(addressBook).then(function(addressBook) {
			// parse contacts
			addressBook.contacts = [];
			for(var i in addressBook.objects) {
				addressBook.contacts.push(
					new Contact(addressBook.objects[i])
				);
			}
			return addressBook;
		});
	};

}]);