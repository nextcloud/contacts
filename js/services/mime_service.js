angular.module('contactsApp')
	.service('MimeService', function() {
		var magicNumbers = {
			'/9j/' : 'JPEG',
			'R0lGOD' : 'GIF',
			'iVBORw0KGgo' : 'PNG'
		};

		this.b64mime = function(b64string) {
			for (var mn in magicNumbers) {
				if(b64string.startsWith(mn)) return magicNumbers[mn];
			}
			return null;
		};
	});
