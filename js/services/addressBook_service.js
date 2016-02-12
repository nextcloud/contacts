app.factory('AddressBookService', ['DavClient', 'DavService', 'SettingsService', 'AddressBook', 'Contact', function(DavClient, DavService, SettingsService, AddressBook, Contact){

	var addressBooks = [];

	var loadAll = function() {
		return DavService.then(function(account) {
			addressBooks = account.addressBooks.map(function(addressBook) {
				return new AddressBook(addressBook);
			});
		});
	};

	return {
		getAll: function() {
			return loadAll().then(function() {
				console.log(addressBooks);
				return addressBooks;
			});
		},

		getGroups: function () {
			return this.getAll().then(function(addressBooks){
				return ['All'].concat(
					addressBooks.map(function (element) {
						return element.groups;
					}).reduce(function(a, b){
						return a.concat(b);
					}));
			});
		},

		getEnabled: function() {
			return DavService.then(function(account) {
				return account.addressBooks.filter(function(addressBook) {
					return SettingsService.get('addressBooks').indexOf(addressBook.displayName) > -1;
				}).map(function(addressBook) {
					return new AddressBook(addressBook);
				});
			});
		},

		getDefaultAddressBook: function() {
			return addressBooks[0];
		},

		create: function(displayName) {
			return DavService.then(function(account) {
				return DavClient.createAddressBook({displayName:displayName, url:account.homeUrl});
			});
		},

		delete: function(addressBook) {
			return DavService.then(function(account) {
				return DavClient.deleteAddressBook(addressBook);
			});
		},

		rename: function(addressBook, displayName) {
			return DavService.then(function(account) {
				return DavClient.renameAddressBook(addressBook, {displayName:displayName, url:account.homeUrl});
			});
		},

		get: function(displayName) {
			return this.getAll().then(function(addressBooks){
				return addressBooks.filter(function (element) {
					return element.displayName === displayName;
				})[0];
			});
		},

		sync: function(addressBook) {
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
		}
	};

}]);
