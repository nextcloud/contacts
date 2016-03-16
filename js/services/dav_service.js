app.service('DavService', function(DavClient) {
	return DavClient.createAccount({
		server: OC.linkToRemoteBase('dav/addressbooks'),
		accountType: 'carddav',
		useProvidedPath: true
	});
});
