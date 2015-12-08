app.service('AddressBookService', ['DavClient', 'DavService', 'AddressBook', 'Contact', function(DavClient, DavService, AddressBook, Contact){

	this.getAll = function() {
		return DavService.then(function(account) {
			return account.addressBooks.map(function(addressBook) {
				return new AddressBook(addressBook);
			});
		});
	};

	this.getEnabled = function() {
		return DavService.then(function(account) {
			return account.addressBooks.filter(function(addressBook) {
				return SettingsService.get('addressBooks').indexOf(addressBook.displayName) > -1;
			}).map(function(addressBook) {
				return new AddressBook(addressBook);
			});
		});
	};

	this.create = function(displayName) {
		return DavService.then(function(account) {
			return DavClient.createAddressBook({displayName:displayName, url:account.homeUrl});
		});
	};

	this.delete = function(addressBook) {
		return DavService.then(function(account) {
			return DavClient.deleteAddressBook(addressBook);
		});
	};

	this.rename = function(addressBook, displayName) {
		return DavService.then(function(account) {
			return DavClient.renameAddressBook(addressBook, {displayName:displayName, url:account.homeUrl});
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
		return DavClient.syncAddressBook(addressBook);/*.then(function(addressBook) {

			// parse contacts
			addressBook.contacts = [];
			for(var i in addressBook.objects) {
				if(typeof addressBook.objects[i] === 'object') {
					addressBook.contacts.push(
						new Contact(addressBook.objects[i])
					);
				}
			}
			return addressBook;
		});*/
	};

}]);
