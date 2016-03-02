app.service('vCardPropertiesService', [function() {
	/* map vCard attributes to internal attributes */
	this.vCardMeta = {
		nickname: {
			multiple: false,
			readableName: t('contacts', 'Nickname'),
			template: 'text'
		},
		org: {
			multiple: false,
			readableName: t('contacts', 'Organisation'),
			template: 'text'
		},
		note: {
			multiple: false,
			readableName: t('contacts', 'Note'),
			template: 'textarea'
		},
		url: {
			multiple: true,
			readableName: t('contacts', 'Url'),
			template: 'url'
		},
		title: {
			multiple: false,
			readableName: t('contacts', 'Title'),
			template: 'text'
		},
		role: {
			multiple: false,
			readableName: t('contacts', 'Role'),
			template: 'text'
		},
		adr: {
			multiple: true,
			readableName: t('contacts', 'Address'),
			template: 'adr',
			defaultValue: ['', '', '', '', '', '', ''],
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]
		},
		categories: {
			multiple: false,
			readableName: t('contacts', 'Categories'),
			template: 'text'
		},
		bday: {
			multiple: false,
			readableName: t('contacts', 'Birthday'),
			template: 'date'
		},
		email: {
			multiple: true,
			readableName: t('contacts', 'E-Mail'),
			template: 'date'
		},
		impp: {
			multiple: true,
			readableName: t('contacts', 'Instant Messaging'),
			template: 'date'
		},
		tel: {
			multiple: true,
			readableName: t('contacts', 'Telephone'),
			template: 'tel',
			options: [
				{id: 'HOME,VOICE', name: t('contacts', 'Home, voice')},
				{id: 'WORK,VOICE', name: t('contacts', 'Work, voice')},
				{id: 'HOME,FAX', name: t('contacts', 'Home, fax')},
				{id: 'WORK,FAX', name: t('contacts', 'Work, fax')},
				{id: 'PAGER', name: t('contacts', 'Pager')},
				{id: 'VOICE', name: t('contacts', 'Voice')},
				{id: 'FAX', name: t('contacts', 'Fax')},
				{id: 'CELL', name: t('contacts', 'Mobile')}
			]
		}
	};

	this.fieldDefinitions = [];
	for (var prop in this.vCardMeta) {
		this.fieldDefinitions.push({id: prop, name: this.vCardMeta[prop].readableName, multiple: this.vCardMeta[prop].multiple});
	}

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
