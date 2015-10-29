app.service('ContactService', [ 'DavClient', function(DavClient) {

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