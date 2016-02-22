app.service('vCardPropertiesService', [function() {
	/* map vCard attributes to internal attributes */
	this.vCardMeta = {
		fn: {
			readableName: 'Full Name', // needs translation
			template: 'text'
		},
		version: {
			template: 'hidden'
		},
		org: {
			readableName: 'Organisation',
			template: 'text'
		},
		note: {
			readableName: 'Note',
			template: 'textarea'
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
			template: 'text',
			necessity: 'optional'
		};
	};

	this.getMeta = function(property) {
		return this.vCardMeta[property] || this.fallbackMeta(property);
	};
}]);
