var contacts;
app.service('ContactService', [ 'DavClient', 'AddressBookService', 'Contact', '$q', 'CacheFactory', 'uuid4', function(DavClient, AddressBookService, Contact, $q, CacheFactory, uuid4) {

	contacts = CacheFactory('contacts');

	this.fillCache = function() {
		return AddressBookService.getEnabled().then(function(enabledAddressBooks) {
			var promises = [];
			enabledAddressBooks.forEach(function(addressBook) {
				promises.push(
					AddressBookService.sync(addressBook).then(function(addressBook) {
						for(var i in addressBook.objects) {
							contact = new Contact(addressBook.objects[i]);
							contacts.put(contact.uid(), contact);
						}
					})
				);
			});
			return $q.all(promises);
		});
	};

	this.getAll = function() {
		return this.fillCache().then(function() {
			var contactsArray = [];
			var keys = contacts.keys();

			keys.forEach(function(key) {
				contactsArray.push(contacts.get(key));
			});

			return contactsArray;
		});
	};

	this.getById = function(uid) {
		return contacts.get(uid);
	};

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

	this.delete = function(contact) {
		// delete contact from server
		return DavClient.deleteCard(contact);
	};

	this.fromArray = function(array) {
		// from array to contact
	};
}]);
