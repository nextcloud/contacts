var contacts = [];
app.service('ContactService', [ 'DavClient', 'AddressBookService', 'Contact', '$q', 'uuid4', function(DavClient, AddressBookService, Contact, $q, uuid4) {

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
				promises.push(prom);
			});

			return $q.all(promises).then(function(test) {
				var flattened = test.reduce(function(a, b) {
				return a.concat(b);
				}, []);
				console.log(test, flattened);
				return flattened;
			});

		});
	};

	this.getById = function(uid){
		return this.getAll().then(function(contacts) {
			return contacts.filter(function(contact) {
				return contact.uid() === uid;
			})[0];
		});
	}

	this.create = function(newContact, addressBook) {
		newContact = newContact || new Contact();
		addressBook = addressBook || AddressBookService.getDefaultAddressBook();

		return DavClient.createCard(
			addressBook,
			{
				data: newContact.data.addressData,
				filename: uuid4.generate() + '.vcf'
			}
		);
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
