app.service('vCardPropertiesService', [function() {
	/* map vCard attributes to internal attributes */
	this.vCardMeta = {
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
			template: 'adr',
			options: [
				{id: 'HOME', name: t('contactsrework', 'Home')},
				{id: 'WORK', name: t('contactsrework', 'Work')},
				{id: 'OTHER', name: t('contactsrework', 'Other')}
			]
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
			template: 'tel',
			options: [
				{id: 'HOME,VOICE', name: t('contactsrework', 'Home, voice')},
				{id: 'WORK,VOICE', name: t('contactsrework', 'Work, voice')},
				{id: 'HOME,FAX', name: t('contactsrework', 'Home, fax')},
				{id: 'WORK,FAX', name: t('contactsrework', 'Work, fax')},
				{id: 'PAGER', name: t('contactsrework', 'Pager')},
				{id: 'VOICE', name: t('contactsrework', 'Voice')},
				{id: 'FAX', name: t('contactsrework', 'Fax')},
				{id: 'CELL', name: t('contactsrework', 'Mobile')}
			]
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
