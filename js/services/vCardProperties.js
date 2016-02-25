app.service('vCardPropertiesService', [function() {
	/* map vCard attributes to internal attributes */
	this.vCardMeta = {
		fn: {
			readableName: t('contactsrework', 'Full Name'),
			template: 'text'
		},
		nickname: {
			readableName: t('contactsrework', 'Nickname'),
			template: 'text'
		},
		org: {
			readableName: t('contactsrework', 'Organisation'),
			template: 'text'
		},
		note: {
			readableName: t('contactsrework', 'Note'),
			template: 'textarea'
		},
		url: {
			readableName: t('contactsrework', 'Url'),
			template: 'url'
		},
		title: {
			readableName: t('contactsrework', 'Title'),
			template: 'text'
		},
		role: {
			readableName: t('contactsrework', 'Role'),
			template: 'text'
		},
		adr: {
			readableName: t('contactsrework', 'Address'),
			template: 'adr'
		},
		categories: {
			readableName: t('contactsrework', 'Categories'),
			template: 'text'
		},
		bday: {
			readableName: t('contactsrework', 'Birthday'),
			template: 'date'
		},
		email: {
			readableName: t('contactsrework', 'E-Mail'),
			template: 'date'
		},
		impp: {
			readableName: t('contactsrework', 'Instant Messaging'),
			template: 'date'
		},
		tel: {
			readableName: t('contactsrework', 'Telephone'),
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
