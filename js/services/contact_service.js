var contacts = [];
app.service('ContactService', [ 'DavClient', 'AddressBookService', 'Contact', '$q', function(DavClient, AddressBookService, Contact, $q) {

	this.getAll = function() {
		return AddressBookService.getEnabled().then(function(enabledAddressBooks) {

			var promises = [];

			enabledAddressBooks.forEach(function(addressBook) {
				var prom = AddressBookService.sync(addressBook).then(function(addressBook) {
					var contacts = [];
					for(var i in addressBook.objects) {
						contacts.push(new Contact(addressBook.objects[i]));
					}
					return contacts;
				});
				console.log(prom);
				promises.push(prom);
			});

			return $q.all(promises).then(function(test) {
				var flattened = test.reduce(function(a, b) {
				return a.concat(b);
				}, []);
				console.log('hi');
				console.log(test, flattened);
				return flattened;
			});

		});
	};

	this.create = function(addressBook) {
		// push contact to server
		return DavClient.createCard(addressBook);
	};

	this.update = function(contact) {
		// update contact on server
		return DavClient.updateCard(contact, {json: true});
	};

	this.remove = function(contact) {
		// delete contact from server
		return DavClient.deleteCard(contact);
	};

	this.fromArray = function(array) {
		// from array to contact
	};
}]);
