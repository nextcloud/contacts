app.service('DavService', ['DavClient', function(client) {
	return client.createAccount({
		server: OC.linkToRemoteBase('carddav'),
		accountType: 'carddav'
	});
}]);