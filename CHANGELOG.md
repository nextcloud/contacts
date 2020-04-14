## 3.3.0 – 2020-04-14

[Full Changelog](https://github.com/nextcloud/contacts/compare/v3.2.0...v3.3.0)

### Enhancements
- Add ability to clone contact
  [\#1462](https://github.com/nextcloud/contacts/pull/1462) ([skjnldsv](https://github.com/skjnldsv))

### Fixed
- Fix no sharing menu position
  [\#1500](https://github.com/nextcloud/contacts/pull/1500) ([skjnldsv](https://github.com/skjnldsv))
- Support multiple type declaration
  [\#942](https://github.com/nextcloud/contacts/issues/942) ([skjnldsv](https://github.com/skjnldsv))

### Security fixed
- Properly sanitize avatars in upload
  [\#1514](https://github.com/nextcloud/contacts/pull/1514) ([skjnldsv](https://github.com/skjnldsv))

## 3.2.0 – 2020-02-29
### Fixed
- Fix first contact sync (Contact saving hangs and protocol says uid already exists)
  [\#1488](https://github.com/nextcloud/contacts/pull/1488) ([skjnldsv](https://github.com/skjnldsv))

### Updated
- Translations

## 3.1.9 – 2020-02-26
### Enhancements
- Fix sorting and wording of contact picture actions
  [\#1448](https://github.com/nextcloud/contacts/pull/1448) ([jancborchardt](https://github.com/jancborchardt))
- Allow importing from files
  [\#1438](https://github.com/nextcloud/contacts/pull/1438) ([skjnldsv](https://github.com/skjnldsv))
- Remove delete action from list, fix \#1368
  [\#1430](https://github.com/nextcloud/contacts/pull/1430) ([jancborchardt](https://github.com/jancborchardt))

### Fixed
- l10n: Changed spelling
  [\#1463](https://github.com/nextcloud/contacts/pull/1463) ([rakekniven](https://github.com/rakekniven))
- Disable form validation for text properties
  [\#1418](https://github.com/nextcloud/contacts/pull/1418) ([hanzi](https://github.com/hanzi))

## 3.1.8 – 2020-01-22
### Fixed
- Fixed release number and 15 is EOL
- Fix issue that prevented new contacts from being saved
  [#1416](https://github.com/nextcloud/contacts/pull/1416) ([hanzi](https://github.com/hanzi))
- remove delete buttons and other actions if contact is not readable
  [#1413](https://github.com/nextcloud/contacts/pull/1413) ([myrho](https://github.com/myrho))
- Only add sharee if not present already
  [#1401](https://github.com/nextcloud/contacts/pull/1401) ([raimund-schluessler](https://github.com/raimund-schluessler))
- Fix 'duplicate types' check for properties with a single type
  [#1399](https://github.com/nextcloud/contacts/pull/1399) ([hanzi](https://github.com/hanzi))
- Workaround for bug that prevented editing vCards with commas in the address
  [#1394](https://github.com/nextcloud/contacts/pull/1394) ([hanzi](https://github.com/hanzi))
- Use correct syntax for vCard version when saving
  [#1393](https://github.com/nextcloud/contacts/pull/1393) ([hanzi](https://github.com/hanzi))
- short company field only if empty
  [#1412](https://github.com/nextcloud/contacts/pull/1412) ([myrho](https://github.com/myrho))

## 3.1.7 – 2019-12-09
### Enhancements
- Make the work profile the default one when adding Contacts
  [#1307](https://github.com/nextcloud/contacts/pull/1307)

### Fixed
- Fix first day of datepicker
  [#1314](https://github.com/nextcloud/contacts/pull/1314)

### Updated
- Dependencies
- Translations

## 3.1.6 – 2019-10-03
### Fixed
- Fix initialStateService for 15
  [#1292](https://github.com/nextcloud/contacts/pull/1292)

## 3.1.5 – 2019-10-03
### Fixed
- Better debug of the duplicate types check
  [#1290](https://github.com/nextcloud/contacts/pull/1290)
- Fix initialStateService for 15
  [#1291](https://github.com/nextcloud/contacts/pull/1291)

## 3.1.4 – 2019-09-28
### Enhancements
- Enhancement/allow year removal
  [#1248](https://github.com/nextcloud/contacts/pull/1248)
- Add TZ & LANG
  [#1264](https://github.com/nextcloud/contacts/pull/1264)
- Added possibility to show and edit vCard Geo attributes
  [#1250](https://github.com/nextcloud/contacts/pull/1250)

### Fixed
- Support vcard 3 photo syntax
  [#1239](https://github.com/nextcloud/contacts/pull/1239)
- Fix moment loading
  [#1249](https://github.com/nextcloud/contacts/pull/1249)
- Add push warning on fixed contact
  [#982](https://github.com/nextcloud/contacts/pull/982)

### Updated
- Dependencies
- Translations

## 3.1.3 – 2019-06-11
### Fixed
- Error on instances <16
  [853c3de](https://github.com/nextcloud/contacts/commit/853c3dead32d1375954e252bb4c3ccce867b56ec)

### Updated
- Translations

## 3.1.2 – 2019-06-10
### Added
- Components update, enhanced design and avatar management
  [#1103](https://github.com/nextcloud/contacts/pull/1103)

### Fixed
- Capture ctrl+s
  [#1102](https://github.com/nextcloud/contacts/pull/1102)
- Fix ghost contact when scrolling
  [#1132](https://github.com/nextcloud/contacts/pull/1132)
- Fix alignment and remove addressbook selector if only one
  [#1074](https://github.com/nextcloud/contacts/pull/1074)

### Updated
- [Security] axios library
- Dependencies
- Translations

## 3.1.1 – 2019-04-16
### Fixed
- Edge support
  [#1064](https://github.com/nextcloud/contacts/pull/1064)
- Cannot remove some properties
  [#1050](https://github.com/nextcloud/contacts/pull/1050)
- Avoid qrcode getting cropped
  [#1055](https://github.com/nextcloud/contacts/pull/1055)
- Add CLOUD property to fieldOrder, so it can be grouped in the UI
  [#1056](https://github.com/nextcloud/contacts/pull/1056)
- Add some padding between header and properties in contact details
  [#1052](https://github.com/nextcloud/contacts/pull/1052)
- Fix some photos not being shown in the list
  [6a9025c](https://github.com/nextcloud/contacts/commit/6a9025c57dfd738d3d25651853bc38e15db90f1c)

### Updated
- Dependencies
- Translations

## 3.1.0 – 2019-04-08
### Added
- Add undo deletion
  [#1025](https://github.com/nextcloud/contacts/pull/1025)
- Allow to pick avatar from files + use modal
  [#1024](https://github.com/nextcloud/contacts/pull/1024)
- Add ABLABEL and ITEMX.property support
  [#991](https://github.com/nextcloud/contacts/pull/991)
- Use displayname as file name when downloading a contact
  [#1022](https://github.com/nextcloud/contacts/pull/1022)
- Show vCard as qrcode
  [#1017](https://github.com/nextcloud/contacts/pull/1017)
- Use virtual scroller for big contacts list display performances
  [#1018](https://github.com/nextcloud/contacts/pull/1018)
- Add sorting by last modified
  [#992](https://github.com/nextcloud/contacts/pull/992)


### Fixed
- Automatic repair of duplicate types
  [#1042](https://github.com/nextcloud/contacts/issues/1042)
- Remove some properties if empty
  [#1035](https://github.com/nextcloud/contacts/issues/1035)
- Use dav hasPhoto to properly load photos into the list
  [#1021](https://github.com/nextcloud/contacts/issues/1021)
- Unable to create new user since v3.0.5 on some browsers, oca_contacts
  [#1010](https://github.com/nextcloud/contacts/issues/1010)
- Cannot see Date of Death to existing contacts
  [#988](https://github.com/nextcloud/contacts/issues/988)
- Properly update store contact on first push
  [#987](https://github.com/nextcloud/contacts/issues/987)

### Updated
- Dependencies
- Translations

## 3.0.5 – 2019-03-11
### Fixed
- Initial contact loading:
  [#984](https://github.com/nextcloud/contacts/issues/984)


## 3.0.4 – 2019-03-10
### Added
- Add REV on update
  [#969](https://github.com/nextcloud/contacts/pull/969)
- Better handle parsing errors
  [#971](https://github.com/nextcloud/contacts/pull/971)
- Add not grouped entry
  [#970](https://github.com/nextcloud/contacts/pull/970)

### Fixed
- Spelling mistake in error message
  [#945](https://github.com/nextcloud/contacts/issues/945)
- Automatically redirect if modRewriteWorking is supported
  [#899](https://github.com/nextcloud/contacts/issues/899)
- Force display date for bday, anniversary and deathdate
  [9057462c34977103a2c68124ee8f50a2d1a967ce](https://github.com/nextcloud/contacts/commit/9057462c34977103a2c68124ee8f50a2d1a967ce)
- Fix FN repair step for ORG
  [bdd93836aa0613e5f9c61f2496505e4c45f1febc](https://github.com/nextcloud/contacts/commit/bdd93836aa0613e5f9c61f2496505e4c45f1febc)
- Saving reverts changes which happened during the save
  [#923](https://github.com/nextcloud/contacts/issues/923)
  [#968](https://github.com/nextcloud/contacts/issues/968)
- White icons fix for preview
  [91dd5c38df05ebb9247df4611703beffa6d08b0e](https://github.com/nextcloud/contacts/commit/91dd5c38df05ebb9247df4611703beffa6d08b0e) 
- Validate on app initialisation
  [#973](https://github.com/nextcloud/contacts/issues/973)
- Fix gender select + auto repair
  [#972](https://github.com/nextcloud/contacts/issues/972)
- Fix conflict mode
  [#981](https://github.com/nextcloud/contacts/issues/981)

### Updated
- Dependencies
- Translations


## 3.0.3 – 2019-02-01
### Added
- Auto fill the display name from the detailed name field if empty, invalid or unchanged from New Contact
  [#898](https://github.com/nextcloud/contacts/issues/898)

### Fixed
- Address book url copy to clipboard
  [#878](https://github.com/nextcloud/contacts/issues/878)
- Conflicting issue when multiple changes to a contact
  [#879](https://github.com/nextcloud/contacts/issues/879)
- Auto fix the display name if invalid
  [#880](https://github.com/nextcloud/contacts/issues/880)
- Fix the display name Format and sorting display
  [#880](https://github.com/nextcloud/contacts/issues/880)
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
