describe('contactModel', function() {

	var $Contact;
	beforeEach(module('contactsApp'));

	beforeEach(inject(function(Contact){
		$Contact = Contact;
	}));

	it('should match a search pattern in title', function() {
		var contact = new $Contact({displayName: 'test'});
		contact.title('The Boss');
		expect(contact.matches('123')).to.equal(false);
		expect(contact.matches('the')).to.equal(true);
		expect(contact.matches('OSS')).to.equal(true);
	});

	it('should match a search pattern in address', function() {
		var contact = new $Contact({displayName: 'test'});
		contact.setProperty('adr', {value: ["12", "", "", "Kenya", "", "", ""]});
		expect(contact.matches('12')).to.equal(true);
		expect(contact.matches('kenya')).to.equal(true);
	});

	it('should parse a valid avatar', function() {
		var contact = new $Contact({displayName: 'test'});
		var base64Photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCAAEAAQDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAB//EABUBAQEAAAAAAAAAAAAAAAAAAAQG/9oADAMBAAIQAxAAAAEuPT//xAAVEAEBAAAAAAAAAAAAAAAAAAADBP/aAAgBAQABBQKiplT/xAAYEQACAwAAAAAAAAAAAAAAAAABAwACMf/aAAgBAwEBPwGz2E7P/8QAGBEAAgMAAAAAAAAAAAAAAAAAAQIAAyH/2gAIAQIBAT8BFSLgE//EABcQAQADAAAAAAAAAAAAAAAAAAEAAgP/2gAIAQEABj8CW2is/8QAFRABAQAAAAAAAAAAAAAAAAAAAFH/2gAIAQEAAT8hq3j/2gAMAwEAAgADAAAAEN//xAAWEQADAAAAAAAAAAAAAAAAAAAAARH/2gAIAQMBAT8QumP/xAAVEQEBAAAAAAAAAAAAAAAAAAAAAf/aAAgBAgEBPxCaH//EABgQAQADAQAAAAAAAAAAAAAAAAEAIVFh/9oACAEBAAE/ECIUCwdzVn//2Q==';
		contact.photo(base64Photo);
		expect(contact.photo()).to.equal(base64Photo);
	});

	it('should ignore an invalid avatar', function() {
		var contact = new $Contact({displayName: 'test'});
		var base64Photo = 'ENCODING=b:iVBORw0KGgoAAAANSUhEUgAAAHwAAAB8CAMAAACcwCSMAAAAgVBMVEX/0QEAAAD/0QD/1wH/1AH/3QH/2QGkigE/NABPQQBSQwABIAAD/2wBDAAEQEBAAAAAAAAEBAAE/ECIUCwdzVn//2Q==';
		contact.photo(base64Photo);
		expect(contact.photo()).to.be.undefined;
	});

	it('should generate proper ISO.8601.2004 date string', function() {
		var contact = new $Contact({displayName: 'test'});
		var d = contact.getISODate(new Date('2016-09-01T09:07:05Z'));
		expect(d).to.equal('20160901T090705Z');
	});
});
