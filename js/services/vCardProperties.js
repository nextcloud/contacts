angular.module('contactsApp')
.service('vCardPropertiesService', function() {
	/**
	 * map vCard attributes to internal attributes
	 *
	 * propName: {
	 * 		multiple: [Boolean], // is this prop allowed more than once? (default = false)
	 * 		readableName: [String], // internationalized readable name of prop
	 * 		template: [String], // template name found in /templates/detailItems
	 * 		[...] // optional additional information which might get used by the template
	 *
	 *		options: If multiple options have the same name, the first will be used as default.
	 *				 Others will be merge, but still supported. Order is important!
	 * }
	 */
	this.vCardMeta = {
		nickname: {
			readableName: t('contacts', 'Nickname'),
			template: 'text',
			icon: 'icon-user'
		},
		n: {
			readableName: t('contacts', 'Detailed name'),
			defaultValue: {
				value:['', '', '', '', '']
			},
			template: 'n',
			icon: 'icon-user'
		},
		note: {
			readableName: t('contacts', 'Notes'),
			template: 'textarea',
			icon: 'icon-rename'
		},
		url: {
			multiple: true,
			readableName: t('contacts', 'Website'),
			template: 'url',
			icon: 'icon-public'
		},
		cloud: {
			multiple: true,
			readableName: t('contacts', 'Federated Cloud ID'),
			template: 'text',
			defaultValue: {
				value:[''],
				meta:{type:['HOME']}
			},
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]		},
		adr: {
			multiple: true,
			readableName: t('contacts', 'Address'),
			template: 'adr',
			icon: 'icon-address',
			defaultValue: {
				value:['', '', '', '', '', '', ''],
				meta:{type:['HOME']}
			},
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]
		},
		categories: {
			readableName: t('contacts', 'Groups'),
			template: 'groups'
		},
		bday: {
			readableName: t('contacts', 'Birthday'),
			template: 'date',
			icon: 'icon-calendar-dark'
		},
		anniversary: {
			readableName: t('contacts', 'Anniversary'),
			template: 'date',
			icon: 'icon-calendar-dark'
		},
		deathdate: {
			readableName: t('contacts', 'Date of death'),
			template: 'date',
			icon: 'icon-calendar-dark'
		},
		email: {
			multiple: true,
			readableName: t('contacts', 'Email'),
			template: 'email',
			icon: 'icon-mail',
			defaultValue: {
				value:'',
				meta:{type:['HOME']}
			},
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]
		},
		impp: {
			multiple: true,
			readableName: t('contacts', 'Instant messaging'),
			template: 'username',
			icon: 'icon-comment',
			defaultValue: {
				value:[''],
				meta:{type:['SKYPE']}
			},
			options: [
				{id: 'IRC', name: 'IRC'},
				{id: 'KIK', name: 'KiK'},
				{id: 'SKYPE', name: 'Skype'},
				{id: 'TELEGRAM', name: 'Telegram'},
				{id: 'XMPP', name:'XMPP'}
			]
		},
		tel: {
			multiple: true,
			readableName: t('contacts', 'Phone'),
			template: 'tel',
			icon: 'icon-comment',
			defaultValue: {
				value:'',
				meta:{type:['HOME,VOICE']}
			},
			options: [
				{id: 'HOME,VOICE', name: t('contacts', 'Home')},
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK,VOICE', name: t('contacts', 'Work')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'CELL', name: t('contacts', 'Mobile')},
				{id: 'CELL,VOICE', name: t('contacts', 'Mobile')},
				{id: 'WORK,CELL', name: t('contacts', 'Work mobile')},
				{id: 'FAX', name: t('contacts', 'Fax')},
				{id: 'HOME,FAX', name: t('contacts', 'Fax home')},
				{id: 'WORK,FAX', name: t('contacts', 'Fax work')},
				{id: 'PAGER', name: t('contacts', 'Pager')},
				{id: 'VOICE', name: t('contacts', 'Voice')},
				{id: 'CAR', name: t('contacts', 'Car')},
				{id: 'PAGER', name: t('contacts', 'Pager')},
				{id: 'WORK,PAGER', name: t('contacts', 'Work pager')}
			]
		},
		'X-SOCIALPROFILE': {
			multiple: true,
			readableName: t('contacts', 'Social network'),
			template: 'username',
			defaultValue: {
				value:[''],
				meta:{type:['facebook']}
			},
			options: [
				{id: 'FACEBOOK', name: 'Facebook'},
				{id: 'GITHUB', name: 'GitHub'},
				{id: 'GOOGLEPLUS', name: 'Google+'},
				{id: 'INSTAGRAM', name: 'Instagram'},
				{id: 'LINKEDIN', name: 'LinkedIn'},
				{id: 'PINTEREST', name: 'Pinterest'},
				{id: 'QZONE', name: 'QZone'},
				{id: 'TUMBLR', name: 'Tumblr'},
				{id: 'TWITTER', name: 'Twitter'},
				{id: 'WECHAT', name: 'WeChat'},
				{id: 'YOUTUBE', name: 'YouTube'}


			]
		},
		related: {
			multiple: true,
			readableName: t('contacts', 'Related'),
			template: 'text',
			info: t('contacts', 'Specify a relationship between another entity and the entity represented by this vCard.'),
			defaultValue: {
				value:[''],
				meta:{type:['CONTACT']}
			},
			options: [
				{id: 'CONTACT', name: t('contacts', 'Contact')},
				{id: 'AGENT', name: t('contacts', 'Agent')},
				{id: 'EMERGENCY', name: t('contacts', 'Emergency')},
				{id: 'FRIEND', name: t('contacts', 'Friend')},
				{id: 'COLLEAGUE', name: t('contacts', 'Colleague')},
				{id: 'COWORKER', name: t('contacts', 'Co-worker')},
				{id: 'MANAGER', name: t('contacts', 'Manager')},
				{id: 'ASSISTANT', name: t('contacts', 'Assistant')},
				{id: 'SPOUSE', name: t('contacts', 'Spouse')},
				{id: 'CHILD', name: t('contacts', 'Child')},
				{id: 'MOTHER', name: t('contacts', 'Mother')},
				{id: 'FATHER', name: t('contacts', 'Father')},
				{id: 'PARENT', name: t('contacts', 'Parent')},
				{id: 'BROTHER', name: t('contacts', 'Brother')},
				{id: 'SISTER', name: t('contacts', 'Sister')},
				{id: 'RELATIVE', name: t('contacts', 'Relative')}
			]
		},
		relationship: {
			readableName: t('contacts', 'Relationship'),
			template: 'select',
			info: t('contacts', 'Specify a relationship between you and the entity represented by this vCard.'),
			options: [
				{id: 'SPOUSE', name: t('contacts', 'Spouse')},
				{id: 'CHILD', name: t('contacts', 'Child')},
				{id: 'MOTHER', name: t('contacts', 'Mother')},
				{id: 'FATHER', name: t('contacts', 'Father')},
				{id: 'PARENT', name: t('contacts', 'Parent')},
				{id: 'BROTHER', name: t('contacts', 'Brother')},
				{id: 'SISTER', name: t('contacts', 'Sister')},
				{id: 'RELATIVE', name: t('contacts', 'Relative')},
				{id: 'FRIEND', name: t('contacts', 'Friend')},
				{id: 'COLLEAGUE', name: t('contacts', 'Colleague')},
				{id: 'MANAGER', name: t('contacts', 'Manager')},
				{id: 'ASSISTANT', name: t('contacts', 'Assistant')},
			]
		},
		gender: {
			readableName: t('contacts', 'Gender'),
			template: 'select',
			options: [
				{id: 'F', name: t('contacts', 'Female')},
				{id: 'M', name: t('contacts', 'Male')},
				{id: 'O', name: t('contacts', 'Other')}
			]
		}
	};

	this.fieldOrder = [
		'org',
		'title',
		'tel',
		'email',
		'adr',
		'impp',
		'nick',
		'bday',
		'anniversary',
		'deathdate',
		'url',
		'X-SOCIALPROFILE',
		'relationship',
		'related',
		'note',
		'categories',
		'role',
		'gender'
	];

	this.fieldDefinitions = [];
	for (var prop in this.vCardMeta) {
		this.fieldDefinitions.push({id: prop, name: this.vCardMeta[prop].readableName, multiple: !!this.vCardMeta[prop].multiple});
	}

	this.fallbackMeta = function(property) {
		function capitalize(string) { return string.charAt(0).toUpperCase() + string.slice(1); }
		return {
			name: 'unknown-' + property,
			readableName: capitalize(property),
			template: 'hidden',
			necessity: 'optional',
			hidden: true
		};
	};

	this.getMeta = function(property) {
		return this.vCardMeta[property] || this.fallbackMeta(property);
	};

});
