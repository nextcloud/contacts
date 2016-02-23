app.service('vCardPropertiesService', [function() {
	/* map vCard attributes to internal attributes */
	this.vCardMeta = {
		fn: {
			readableName: 'Full Name', // needs translation
			template: 'text'
		},
		nickname: {
			readableName: 'Nickname',
			template: 'text'
		},
		org: {
			readableName: 'Organisation',
			template: 'text'
		},
		note: {
			readableName: 'Note',
			template: 'textarea'
		},
		url: {
			readableName: 'Url',
			template: 'url'
		},
		title: {
			readableName: 'Title',
			template: 'text'
		},
		role: {
			readableName: 'Role',
			template: 'text'
		},
		tel: {
			readableName: 'Telephone',
			template: 'tel'
		}
	};

	this.fallbackMeta = function(property) {
		function capitalize(string) { return string.charAt(0).toUpperCase() + string.slice(1); }
		return {
			name: "unknown-" + property,
			readableName: capitalize(property),
			template: 'hidden',
			necessity: 'optional'
		};
	};

	this.getMeta = function(property) {
		return this.vCardMeta[property] || this.fallbackMeta(property);
	};
}]);
