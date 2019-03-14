## 3.0.5 – 2019-03-11
### Fixed
- Initial contact loading:
  [#984](https://github.com/nextcloud/contacts/984)


## 3.0.4 – 2019-03-10
### Added
- Add REV on update
  [#969](https://github.com/nextcloud/contacts/969)
- Better handle parsing errors
  [#971](https://github.com/nextcloud/contacts/971)
- Add not grouped entry
  [#970](https://github.com/nextcloud/contacts/970)

### Fixed
- Spelling mistake in error message
  [#945](https://github.com/nextcloud/contacts/945)
- Automatically redirect if modRewriteWorking is supported
  [#899](https://github.com/nextcloud/contacts/899)
- Force display date for bday, anniversary and deathdate
  [9057462c34977103a2c68124ee8f50a2d1a967ce](https://github.com/nextcloud/contacts/commit/9057462c34977103a2c68124ee8f50a2d1a967ce)
- Fix FN repair step for ORG
  [bdd93836aa0613e5f9c61f2496505e4c45f1febc](https://github.com/nextcloud/contacts/commit/bdd93836aa0613e5f9c61f2496505e4c45f1febc)
- Saving reverts changes which happened during the save
  [#923](https://github.com/nextcloud/contacts/923)
  [#968](https://github.com/nextcloud/contacts/968)
- White icons fix for preview
  [91dd5c38df05ebb9247df4611703beffa6d08b0e](https://github.com/nextcloud/contacts/commit/91dd5c38df05ebb9247df4611703beffa6d08b0e) 
- Validate on app initialisation
  [#973](https://github.com/nextcloud/contacts/973)
- Fix gender select + auto repair
  [#972](https://github.com/nextcloud/contacts/972)
- Fix conflict mode
  [#981](https://github.com/nextcloud/contacts/981)

### Updated
- Dependencies
- Translations


## 3.0.3 – 2019-02-01
### Added
- Auto fill the display name from the detailed name field if empty, invalid or unchanged from New Contact
  [#898](https://github.com/nextcloud/contacts/898)

### Fixed
- Address book url copy to clipboard
  [#878](https://github.com/nextcloud/contacts/878)
- Conflicting issue when multiple changes to a contact
  [#879](https://github.com/nextcloud/contacts/879)
- Auto fix the display name if invalid
  [#880](https://github.com/nextcloud/contacts/880)
- Fix the display name Format and sorting display
  [#880](https://github.com/nextcloud/contacts/880)
- Removed unnecessary request on contact creation

### Updated
- Dependencies
- Translations


## 3.0.2 – 2019-01-21
### Changed
- Search case is now insensitive

### Fixed
- VCard group download on firefox
- Data propagation across different set of fields
- Dates off by one month
- Property deletion
- Addressbook deletion
- Federated cloud fields
- Contactsmenu
- Datepicker design

### Updated
- Dependencies
- Translations


## 3.0.1 – 2018-12-24
### Changed
- Better error handling

### Fixed
- Deathdate
- Datepicker
- Add new property

### Updated
- Dependencies
- Translations


## 3.0.0 – 2018-12-15
### Added
- Use nextcloud locale settings to display dates
- Faster loading and overall reactivity
- Better import process
- Show default set of fields on new contacts
- Design enhancement
- You can now delete contacts from the list
- You can now download groups as vcf file
- New contacts are not synced to the server until edited. No more empty contacts on your addressbooks!
- Better compatibility with other vcard editors

### Fixed
- #122, BDAY format in VCARD, missing "-"
- #133, allow to enter and differentiate more than one mobile phone - number, e.g for business and private use
- #146, German Date Format
- #200, Empty field property options missing
- #270, FN field behaviour: first and last name
- #488, Removing default name for new contact and leaving it blank
- #253, Show fields for phone, email, address and groups by default for new contact
- #259, Show fields for phone, email, address and groups by default
- #293, Improve the sharing view of addressbooks
- #337, "undefined" group is created
- #361, Display Name is overwritten by First Name / Last Name changes.
- #372, sorting order to 'first name' or 'last name' leads to strange behavior when scrolling to contacts
- #379, "/" in a user group name doesn't work
- #394, optimize the shortening and alignment of field labels
- #433, vCard import broken: window.localStorage is null
- #468, SVG not encoded or rendered correctly
- #520, please clarify which formats AND versions are supported
- #545, Social Network types drop-down is missing "Mastodon"
- #547, Company contact entries don't display properly on load
- #585, Click on a non existing contact results in a endless spinner
- #592, Inconsistent use of username when sharing an address book
