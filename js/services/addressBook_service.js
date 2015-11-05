app.service('AddressBookService', ['DavClient', 'DavService', 'Contact', function(DavClient, DavService, Contact){

	this.getAll = function() {
		return DavService.then(function(account) {
			return account.addressBooks;
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
		return DavClient.syncAddressBook(addressBook).then(function(addressBook) {
			/*addressBook.contacts = [];
			console.log(addressBook.objects);
			for(i in addressBook.objects) {
				addressBook.contacts.push(
					new Contact(addressBook.objects[i].data)
				);
			}*/
			return addressBook;
		});
	};

}]);