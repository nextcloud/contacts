# Changelog
All notable changes to this project will be documented in this file.

# 8.0.O

### Bug Fixes
* virtual contacts list scroller logic
* translation for recently contacted not working
* textarea auto resizing
* adjust import files action to vue 3
* save team name and description on Save button click
* make team resources scrollable
* restore member management in new ui
* restore accept/reject requests in new ui

### Features 
* migrate app to Vue 3
* use material symbol variant of delete icon
* make icons outline
* add multiselect action and batch deleting
* Add support for Nextcloud 32 and drop support for lower versions


# [7.0.0](https://github.com/nextcloud/contacts/compare/v6.1.0-alpha.2...v7.0.0-beta.Z) (2025-01-09)


### Bug Fixes

* remove app-content-details from global styling ([12707c4](https://github.com/nextcloud/contacts/commit/12707c44de901e44950cb37df6cc3fd1f1f17303))
* **routing** add proper routing for circles([a0a80c9](https://github.com/nextcloud/contacts/commit/a0a80c9f11cd8fb934699ffd92ac9d822e115eaf))
* share address books with user groups ([6e87aca](https://github.com/nextcloud/contacts/pull/4291/commits/6e87aca3c4406cebc4b0699a489bd247355c91b3))
* **circles** misaligned member modal headings ([a5ec367](https://github.com/nextcloud/contacts/commit/a5ec3675565a450b5b2da09b5b97714df059d483))
* adjust spacing and alignment in the contact details view ([75ee842](https://github.com/nextcloud/contacts/commit/75ee842cd90db8c6436c18855090b4319c442f75))
* Adjust styling of team resource images ([8b65d58](https://github.com/nextcloud/contacts/commit/8b65d581e5ce6ddffa75695f141abda824dd12ce))
* Allow dynamic autoloading for classes added during upgrade ([08e5f9e](https://github.com/nextcloud/contacts/commit/08e5f9e9241c1162b277764d6711823f3b0e7182))
* bundle moment.js locale data ([9fb1d09](https://github.com/nextcloud/contacts/commit/9fb1d09b20a6b702da000431b44ededce9a1f35a))
* check if photo property is set before downloading ([f33c353](https://github.com/nextcloud/contacts/commit/f33c353ce92096a5c715a75a1c4fd8629eed932b))
* **CircleDetails:** Improve calculation of member list ([05be5e3](https://github.com/nextcloud/contacts/commit/05be5e320697d45371c7a91ae07e31196e931830))
* **CircleNavigationItem:** Rename 'add member' to 'manage team' ([eda53a5](https://github.com/nextcloud/contacts/commit/eda53a564d23bc87d9c5bfd614e5ddc8f7fe4777))
* **circles:** sort fallback if not member of circle ([05f04df](https://github.com/nextcloud/contacts/commit/05f04df69e9c09d9f4443e11d53601f9d2381d50))
* **contacts:** split up detailed-name again to fix vCard ([501b990](https://github.com/nextcloud/contacts/commit/501b9905abdf55f45f3d67b72680c2cf6918b13c))
* convert pre-commit to common js ([afd5a5a](https://github.com/nextcloud/contacts/commit/afd5a5a0600e0bfb9836e137105e3ede8cd7d749))
* convert pre-commit.js to ES module ([6f06719](https://github.com/nextcloud/contacts/commit/6f06719e8b7740ca16b901b8fc0d9af8d993b462))
* **copy:** Hide not copyable addressbooks in copy select ([b588aac](https://github.com/nextcloud/contacts/commit/b588aac99118e649c02abb3ac0cd1dc5e7ac3468))
* **deps:** bump @nextcloud/auth from 2.3.0 to ^2.4.0 ([ef072de](https://github.com/nextcloud/contacts/commit/ef072deebc3b057a9dd43466ec88c90df96a5b89))
* **deps:** bump @nextcloud/axios from 2.5.0 to ^2.5.1 ([85f127a](https://github.com/nextcloud/contacts/commit/85f127af7627e2e6714f6ed6632bb84f79bee73a))
* **deps:** bump @nextcloud/cdav-library from 1.3.0 to ^1.4.0 ([a02a4b5](https://github.com/nextcloud/contacts/commit/a02a4b5d5f60e62abcf5b39cf12474a6a5d47afa))
* **deps:** bump @nextcloud/cdav-library from 1.4.0 to ^1.5.1 ([ff451d0](https://github.com/nextcloud/contacts/commit/ff451d02c0749cbe85688f6a17b49e2568efe399))
* **deps:** bump @nextcloud/cdav-library from 1.5.1 to ^1.5.2 ([0277f19](https://github.com/nextcloud/contacts/commit/0277f19a63f2080ee9270892b27e1c032c11c88e))
* **deps:** bump @nextcloud/dialogs from 5.3.1 to ^5.3.2 ([c89c5e1](https://github.com/nextcloud/contacts/commit/c89c5e1e18a73699c16779b019359fbaf3742927))
* **deps:** bump @nextcloud/dialogs from 5.3.2 to ^5.3.3 ([f2941f8](https://github.com/nextcloud/contacts/commit/f2941f876fcc67c0b1d09a287462a430194e0f7c))
* **deps:** bump @nextcloud/dialogs from 5.3.3 to ^5.3.4 ([63bdf07](https://github.com/nextcloud/contacts/commit/63bdf07c90e807cf95bd7f1c2a2e26c7a68e02b8))
* **deps:** bump @nextcloud/dialogs from 5.3.4 to ^5.3.5 ([fd6bb23](https://github.com/nextcloud/contacts/commit/fd6bb234d140157a72e495df884d6cc9cd5e99a8))
* **deps:** bump @nextcloud/dialogs from 5.3.5 to ^5.3.7 ([2e6b7cf](https://github.com/nextcloud/contacts/commit/2e6b7cf8aee60612a66cefaf8c3415c6068f75d3))
* **deps:** bump @nextcloud/dialogs from 5.3.7 to ^5.3.8 ([a7abab3](https://github.com/nextcloud/contacts/commit/a7abab3de1b26f4f89ee3140d16dc41657297fd4))
* **deps:** bump @nextcloud/event-bus from 3.3.1 to ^3.3.1 ([b1af001](https://github.com/nextcloud/contacts/commit/b1af00165ed4ec0292ef87a29a18c8aff8b5f1e8))
* **deps:** bump @nextcloud/files from 3.4.1 to ^3.4.1 ([cb81009](https://github.com/nextcloud/contacts/commit/cb810095c4d3ba91e4ca1a1f568a14b3210f2e56))
* **deps:** bump @nextcloud/files from 3.4.1 to ^3.5.0 ([718a090](https://github.com/nextcloud/contacts/commit/718a0900392d77f081fad22838d39e7d6950a710))
* **deps:** bump @nextcloud/files from 3.5.0 to ^3.5.1 ([ef312d3](https://github.com/nextcloud/contacts/commit/ef312d362319eb78152886487f0428d0301b7687))
* **deps:** bump @nextcloud/files from 3.5.1 to ^3.6.0 ([770b27c](https://github.com/nextcloud/contacts/commit/770b27c738763358faf3c6ecb6bcb8568ad01895))
* **deps:** bump @nextcloud/files from 3.8.0 to ^3.8.0 ([769a947](https://github.com/nextcloud/contacts/commit/769a94783446ea64d9e94b23e4896eca2e3718ef))
* **deps:** bump @nextcloud/files from 3.8.0 to ^3.9.0 ([3a016b2](https://github.com/nextcloud/contacts/commit/3a016b2655b04df0f916ecc5b4a18182e18e52d8))
* **deps:** bump @nextcloud/files from 3.9.1 to ^3.10.0 ([498fb12](https://github.com/nextcloud/contacts/commit/498fb127eb9690d96c0c8bb51f8c243a09a7a166))
* **deps:** bump @nextcloud/files from 3.9.1 to ^3.9.1 ([1e086f9](https://github.com/nextcloud/contacts/commit/1e086f91bb0763e9e618f302108d7334ab2433bb))
* **deps:** bump @nextcloud/l10n from 2.2.0 to v3 ([df25646](https://github.com/nextcloud/contacts/commit/df25646a5392d66b648bd83b3265160bf417ea6e))
* **deps:** bump @nextcloud/logger from 2.7.0 to v3 ([73eecbc](https://github.com/nextcloud/contacts/commit/73eecbcde459436095a23bb7b2c9773b8d18bc96))
* **deps:** bump @nextcloud/paths from 2.2.1 to ^2.2.1 ([9b6c6d3](https://github.com/nextcloud/contacts/commit/9b6c6d38ba88f2dd69b65a5a0587db98adc02ca5))
* **deps:** bump @nextcloud/router from 2.2.0 to v3 ([96af3c5](https://github.com/nextcloud/contacts/commit/96af3c573aa4300ca258961046e8b149f58de3c6))
* **deps:** bump @nextcloud/sharing from 0.1.0 to ^0.2.2 ([29c3f76](https://github.com/nextcloud/contacts/commit/29c3f7603722548160a994262f5df616534686ca))
* **deps:** bump @nextcloud/sharing from 0.2.3 to ^0.2.3 ([03d3efc](https://github.com/nextcloud/contacts/commit/03d3efc0a1b85117cf0609c8a1d9cad7b8c025d4))
* **deps:** bump @nextcloud/vue from 8.11.3 to ^8.12.0 ([21dbcf5](https://github.com/nextcloud/contacts/commit/21dbcf5653b9fdd11da99f5cc88ddb8a7636ba88))
* **deps:** bump @nextcloud/vue from 8.12.0 to ^8.13.0 ([56fc63c](https://github.com/nextcloud/contacts/commit/56fc63c07b1f2c69c25433c1f896f9fecd18f6d4))
* **deps:** bump @nextcloud/vue from 8.13.0 to ^8.14.0 ([5d85e20](https://github.com/nextcloud/contacts/commit/5d85e2098ca802b7998535618e4c76009197f0f9))
* **deps:** bump @nextcloud/vue from 8.14.0 to ^8.15.0 ([5dc3c14](https://github.com/nextcloud/contacts/commit/5dc3c1419c38b05f9eac5f7c8f9d63a540a40724))
* **deps:** bump @nextcloud/vue from 8.15.0 to ^8.15.1 ([0919189](https://github.com/nextcloud/contacts/commit/0919189714270b519fe2fd7cedd695ca230bf99a))
* **deps:** bump @nextcloud/vue from 8.15.1 to ^8.18.0 ([096dd07](https://github.com/nextcloud/contacts/commit/096dd0713df368cc86ce7dc36aa55e4740ec6750))
* **deps:** bump @nextcloud/vue from 8.18.0 to ^8.19.0 ([f59b0f2](https://github.com/nextcloud/contacts/commit/f59b0f2dd13292262a474d12e9e0eb2bdd85891c))
* **deps:** bump @vueuse/core from 10.11.1 to ^10.11.1 ([17b1ac7](https://github.com/nextcloud/contacts/commit/17b1ac7ab4dd0248d52cd80c44dca61fff48d6f2))
* **deps:** bump @vueuse/core from 10.11.1 to v11 ([5545596](https://github.com/nextcloud/contacts/commit/5545596592dd0b51ab3bb9e026dc8bdc97732a92))
* **deps:** bump @vueuse/core from 10.9.0 to ^10.11.0 ([09b06c9](https://github.com/nextcloud/contacts/commit/09b06c9a933974e1b8e6b6d02e1a929a9ea3f249))
* **deps:** bump @vueuse/core from 11.0.3 to ^11.1.0 ([e66804d](https://github.com/nextcloud/contacts/commit/e66804d331598e14b8499f026f3d306384f12f84))
* **deps:** bump @vueuse/core from 11.1.0 to ^11.2.0 ([8d5dad1](https://github.com/nextcloud/contacts/commit/8d5dad1683fd3ae083673e5765fa630806dc5077))
* **deps:** bump @vueuse/core from 11.2.0 to ^11.3.0 ([38470f6](https://github.com/nextcloud/contacts/commit/38470f6797641ac783ad171bf72b67eb4ed734a5))
* **deps:** bump debounce from 2.0.0 to ^2.1.0 ([1834ff5](https://github.com/nextcloud/contacts/commit/1834ff551a615545bf8d9f6adf1514093201110e))
* **deps:** bump debounce from 2.1.0 to ^2.1.1 ([81ddf6e](https://github.com/nextcloud/contacts/commit/81ddf6e59612642edbcbb73bb6765fad8ca4fb31))
* **deps:** bump debounce from 2.1.1 to ^2.2.0 ([5d2d79c](https://github.com/nextcloud/contacts/commit/5d2d79c963ac5d7d86d799ebdd6c2dc0e988d80b))
* **deps:** bump ical.js from 1.5.0 to v2 ([ef70705](https://github.com/nextcloud/contacts/commit/ef70705cb84b033e33dab46f68f94c947deed73b))
* **deps:** bump ical.js from 2.0.1 to ^2.1.0 ([5ae2289](https://github.com/nextcloud/contacts/commit/5ae2289795d5cddacc89373f7c330cb642ed742a))
* **deps:** bump p-limit from 5.0.0 to v6 ([f8996aa](https://github.com/nextcloud/contacts/commit/f8996aa6de495ac632542bcf71b77ac185811151))
* **deps:** bump pinia from 2.1.7 to ^2.2.2 ([5e0ec67](https://github.com/nextcloud/contacts/commit/5e0ec67c3321c5e9f412f8c79e4aaaadc40953f0))
* **deps:** bump pinia from 2.2.2 to ^2.2.4 ([92bcb60](https://github.com/nextcloud/contacts/commit/92bcb60ade7c742a25aad66f3906787ee3e74cde))
* **deps:** bump pinia from 2.2.4 to ^2.2.6 ([81d78eb](https://github.com/nextcloud/contacts/commit/81d78eb0fc9127e3b745082f2ab4341a92dc4eb7))
* **deps:** bump pinia from 2.2.6 to ^2.2.8 ([1fe78fe](https://github.com/nextcloud/contacts/commit/1fe78fe1d9fb0616c9b94c7c4e3a37c55b0e8a1f))
* **deps:** bump pinia from 2.2.8 to ^2.3.0 ([04a1d6f](https://github.com/nextcloud/contacts/commit/04a1d6fc2019d7d5c6f09cfc6ae1e7e8d1dbe3de))
* **deps:** bump uuid from 10.0.0 to v11 ([35dbc90](https://github.com/nextcloud/contacts/commit/35dbc9005f7c35228c9bc19f432bda4bc7e6708d))
* **deps:** bump uuid from 11.0.2 to ^11.0.3 ([a854c30](https://github.com/nextcloud/contacts/commit/a854c305e3f1f75477c7a771297546e1476c3b1a))
* **deps:** bump uuid from 9.0.1 to v10 ([b350b27](https://github.com/nextcloud/contacts/commit/b350b2781f3b4e394e0ea80926c127b401defb8d))
* **deps:** bump vue monorepo from 2.7.16 to ~2.7.16 ([bda5244](https://github.com/nextcloud/contacts/commit/bda5244373d44f82e6eb2f5ed1fc302bf5968b0e))
* **deps:** bump vue-material-design-icons from 5.3.0 to ^5.3.1 ([b94efd8](https://github.com/nextcloud/contacts/commit/b94efd8c389c3508de9113269e9cf1687517d243))
* **deps:** fix npm audit ([7d53f6c](https://github.com/nextcloud/contacts/commit/7d53f6c45b90be54dcb09016682531c7c3794991))
* **deps:** fix npm audit ([85197a0](https://github.com/nextcloud/contacts/commit/85197a0eb40ab9d16233ce2989dc3862047e17da))
* **deps:** Fix npm audit ([f3087bc](https://github.com/nextcloud/contacts/commit/f3087bc5e5df5bccaa614fa51ce7bc20d63ddf1d))
* **deps:** Fix npm audit ([c46b418](https://github.com/nextcloud/contacts/commit/c46b418658c1bc1d35403dd3f4641e8e4c45e493))
* **GroupNavigationItem:** encode exported contact groups as UTF-8 ([7e54582](https://github.com/nextcloud/contacts/commit/7e5458245f7206e1ae91c876fe9cfbeaa8a88990))
* improve matching for tel type parameter ([503ae11](https://github.com/nextcloud/contacts/commit/503ae11e1f23c5d77c7e704cb65f813b43327066))
* long contact name overlapping with other content ([1db37fb](https://github.com/nextcloud/contacts/commit/1db37fb0e3a51d9dd046be576723f2ed9891659e))
* **MemberList:** Don't use VirtualList for listing members ([3bf8e6c](https://github.com/nextcloud/contacts/commit/3bf8e6c797fddcc836ef5a8dbfb81373185d7ddb)), closes [#3996](https://github.com/nextcloud/contacts/issues/3996)
* **MembersListItem:** Adjustments to ListItemIcon properties ([5bb226f](https://github.com/nextcloud/contacts/commit/5bb226f36aa538f98424341b7b5fa8129d277c20))
* **Members:** Rename 'Contact groups' to 'groups' ([2d98c29](https://github.com/nextcloud/contacts/commit/2d98c296f8da282f340b4afaed157ae25f6fde49)), closes [#3607](https://github.com/nextcloud/contacts/issues/3607)
* redesign seetings toggle to Nextcloud 30 style ([3e2e7e3](https://github.com/nextcloud/contacts/commit/3e2e7e37639c5a6a13dd40d2b794a917a387ef9c))
* **release:** Fix wget output option ([75c3b5b](https://github.com/nextcloud/contacts/commit/75c3b5b94038ebd87d9cb583a2f94a93d01a3b17))
* remove loading contacts-index style ([eca822f](https://github.com/nextcloud/contacts/commit/eca822f6850254d7122b7588c572c101d6e11fd8))
* remove prop mutation ([cec394e](https://github.com/nextcloud/contacts/commit/cec394e8e6b9d4fab324d0a63b94ba768928af3f))
* remove unused style ([2f0282a](https://github.com/nextcloud/contacts/commit/2f0282a354dad9b49165eb635337f9b9cd7960e3))
* respect advanced group sharing settings in frontend ([5450606](https://github.com/nextcloud/contacts/commit/5450606f4832da9e0c60168f827d287423832dfd))
* responsivness for contacts details ([71d3bc9](https://github.com/nextcloud/contacts/commit/71d3bc972b102e43fde5495420928eaf68d04e11))
* scrobbale button in navigation ([195a58e](https://github.com/nextcloud/contacts/commit/195a58e74f8f7ba03888ef15abc12f6630d45c5b))
* **settings:** clarify settings option for open circle ([0aba545](https://github.com/nextcloud/contacts/commit/0aba5455be6362c1e5e5306a4c71cab34097ec28))
* **socialavatar:** Match base class argument name ([b0abe36](https://github.com/nextcloud/contacts/commit/b0abe36e461da17a550f119b4a11c18e7a6c290e))
* **socialavatars:** Fix HTTP client usage ([687ab6b](https://github.com/nextcloud/contacts/commit/687ab6b81d61d6a8cfa278d01f491df21ed6eb03))
* support for RFC 6474 ([b4e205d](https://github.com/nextcloud/contacts/commit/b4e205d946cec2c88eb4d1541c4295c82223a463))
* update icon work ([b224e5e](https://github.com/nextcloud/contacts/commit/b224e5eebaf0a3abf9c40f386d18b8b258267237))
* validate group name ([eb4ea50](https://github.com/nextcloud/contacts/commit/eb4ea50c8dfb49fb7e444427776ae244f24e2510))


### Features

* add support for webp contact avatars ([e41a2e1](https://github.com/nextcloud/contacts/commit/e41a2e1cd347eb6e417ae508aafd7021f1b56920))
* **circles:** sort by initiator level and change icons ([143edd6](https://github.com/nextcloud/contacts/commit/143edd6c00b644706574ede20b669f613de62910))
* **contacts:** Show address book description if provided ([69d14aa](https://github.com/nextcloud/contacts/commit/69d14aa496563295886b0ab5b828dc9a24dd3106))
* create a readonly contactdetails ([b5458b1](https://github.com/nextcloud/contacts/commit/b5458b1caa4c7e18df8a5a359e72fafe359092df))
* **deps:** Add Nextcloud 29 support ([cd6b367](https://github.com/nextcloud/contacts/commit/cd6b367783e6b98539420139e1fb8272eddd1ecb))
* **deps:** Add nextcloud 30 support ([425a906](https://github.com/nextcloud/contacts/commit/425a906c101027f489af607b78b4ed35fb86ac5e))
* **deps:** Add Nextcloud 31 support ([166c6ff](https://github.com/nextcloud/contacts/commit/166c6fffff1b33029506d9f61130fd6847a82752))
* Implement team overview page updates ([e947bcc](https://github.com/nextcloud/contacts/commit/e947bccda653851ca999ba980143c1290e162f43))
* improve group adding ([ed0e80e](https://github.com/nextcloud/contacts/commit/ed0e80e91fc16c5d8133c4474d10a33e31d7089b))
* **PropertyGroups:** sort groups alphabetically ([0ab7fea](https://github.com/nextcloud/contacts/commit/0ab7feab20ba46a8af2cc257ee0054d164edf396))
* Rebrand circles to teams in the frontend ([45b7dca](https://github.com/nextcloud/contacts/commit/45b7dcadcf61d28f52c8252164f6f7b991eeb8d7))
* rename and delete groups ([88d9e72](https://github.com/nextcloud/contacts/commit/88d9e72ed1b7664cdc7965abcb4a4209a34f62e6))
* show loading icon when deleting or renaming groups ([0f43086](https://github.com/nextcloud/contacts/commit/0f43086c251a3a0986e50146d7398745bc999d7e))


### Performance Improvements

* migrate to vite ([5a2d57d](https://github.com/nextcloud/contacts/commit/5a2d57de2c265d29d1178e9aa828c5ed0d21e6d6))


### Reverts

* Revert "style(ContactsListItem): fix subtitle" ([1c1b865](https://github.com/nextcloud/contacts/commit/1c1b865272d27c0db23aed779a778b3c70ebba73))

### Refactors

* simplify constructor property declarations ([0c0bf64](https://github.com/nextcloud/contacts/commit/0c0bf64e5d0f8d9337740e80270e7d18c186ddb7))


# [5.3.0-beta2](https://github.com/nextcloud/contacts/compare/v5.3.0-beta1...v5.3.0-beta2) (2023-05-12)


### Bug Fixes

* **contacts:** display the new avatar on change ([de726e1](https://github.com/nextcloud/contacts/commit/de726e10d6a68907397060627fe1bcd53dca5cb8))



# [5.3.0-beta1](https://github.com/nextcloud/contacts/compare/v5.3.0-alpha1...v5.3.0-beta1) (2023-05-05)


### Bug Fixes

* **contacts:** defer birthday exclusion until contact was loaded ([2e1e139](https://github.com/nextcloud/contacts/commit/2e1e13980542bf53d6178d54ce9d9d23dda7fba2))
* **contacts:** display name not uri for recent-contacted address book ([6421bd4](https://github.com/nextcloud/contacts/commit/6421bd4499a90bf35ce777641a411f3ee64e43af))
* **contacts:** remove obsolete warning and fix header alignment ([8ef7e85](https://github.com/nextcloud/contacts/commit/8ef7e854a5f47dc4312e46c1f6446f74a2050866))
* defer rendering contact import button ([8435aa7](https://github.com/nextcloud/contacts/commit/8435aa7a9efaeec1312fe156eabbcca533c92cbf))
* disable select component if single option ([836bb9a](https://github.com/nextcloud/contacts/commit/836bb9af1733368baecaf21e42a7e28e40a06301))
* double scrollbar in details pane ([1f2f0fe](https://github.com/nextcloud/contacts/commit/1f2f0fef17c6312c03eb1da74496b0c8d26302a3))
* ellipsized "other social media" dropdown ([85fde3a](https://github.com/nextcloud/contacts/commit/85fde3a480e7356a84ec819d5a03d74267bf3361))
* improve design add new Property and change behaviour ([16b93f8](https://github.com/nextcloud/contacts/commit/16b93f8cee1ca48aa8301e70662de9d5587682f3))
* mime case matching ([fdbd984](https://github.com/nextcloud/contacts/commit/fdbd9849d42aa4441f1374dabff75c143c68dfe4))


### Features

* **2464:** exclude contact from birthday calendar ([e9730d6](https://github.com/nextcloud/contacts/commit/e9730d6b425cf30a6345685af9f987b166d4a16c))
* **contacts:** add add-prop button direct in prop ([9fa3e81](https://github.com/nextcloud/contacts/commit/9fa3e817cd7690b9c7e84a4c5ec61ba17fc7e9cd))
* **contacts:** adjust header to single column layout ([f348b2e](https://github.com/nextcloud/contacts/commit/f348b2e19c949a916e7b8974ea32e5d5c4add435))
* **contacts:** implement final design enhancements from mockups ([923d14b](https://github.com/nextcloud/contacts/commit/923d14b652e121b260ebad5cf1dfb9094ea257ba))
* **contacts:** implement read-only and edit modes ([0972b74](https://github.com/nextcloud/contacts/commit/0972b744116bfa7bd8fcb4ee9dd29c0eda23b872))
* **contacts:** implement single column layout ([7a7a95e](https://github.com/nextcloud/contacts/commit/7a7a95e4e428f33a7cd4969961832b786806ee42))
* **deps:** Add Nextcloud 27 support ([dc5ae56](https://github.com/nextcloud/contacts/commit/dc5ae56ce9977c54267788bbf32961f54a4d1ce2))
* **deps:** Revive PHP7.4 support ([508c5a1](https://github.com/nextcloud/contacts/commit/508c5a151d6b8f8c4443c38c151aa5dc566d2e72))


### Performance Improvements

* **autoloader:** Use Composer's authoritative classmap ([3ed7e01](https://github.com/nextcloud/contacts/commit/3ed7e017dbd72ebf6f3171fecfb489043945ff78))
* **bundles:** migrate nc-vue imports ([69a29d9](https://github.com/nextcloud/contacts/commit/69a29d9203382d0d86cd13e4ec03fc5cf79b205c))


### Reverts

* Revert "Bump vue and vue-template-compiler" ([75518ea](https://github.com/nextcloud/contacts/commit/75518ea21314884c4d8088f5f46f93410b36d8ba))
* Revert "Add manually-triggered branch-off workflow" ([d1f2ea1](https://github.com/nextcloud/contacts/commit/d1f2ea1925678f8629dc0476139ca92c977f214c))



# [5.0.0-alpha4](https://github.com/nextcloud/contacts/compare/v5.0.0-alpha3...v5.0.0-alpha4) (2022-09-27)



# [5.0.0-alpha3](https://github.com/nextcloud/contacts/compare/v5.0.0-alpha2...v5.0.0-alpha3) (2022-09-22)



# [5.0.0-alpha2](https://github.com/nextcloud/contacts/compare/v5.0.0-alpha1...v5.0.0-alpha2) (2022-09-19)



# [5.0.0-alpha1](https://github.com/nextcloud/contacts/compare/v4.1.0...v5.0.0-alpha1) (2022-09-16)



# [4.1.0](https://github.com/nextcloud/contacts/compare/v4.0.1...v4.1.0) (2022-03-22)



## [4.0.2](https://github.com/nextcloud/contacts/compare/v4.0.0...v4.0.2) (2021-08-25)



# [4.0.0-rc.0](https://github.com/nextcloud/contacts/compare/v4.0.0-beta.3...v4.0.0-rc.0) (2021-07-05)



# [4.0.0-beta.3](https://github.com/nextcloud/contacts/compare/v4.0.0-beta.2...v4.0.0-beta.3) (2021-06-21)



# [4.0.0-beta.2](https://github.com/nextcloud/contacts/compare/v3.5.1...v4.0.0-beta.2) (2021-06-17)



## [3.5.1](https://github.com/nextcloud/contacts/compare/v3.5.0...v3.5.1) (2021-03-17)



# [3.5.0](https://github.com/nextcloud/contacts/compare/v3.4.3...v3.5.0) (2021-03-15)



## [3.4.3](https://github.com/nextcloud/contacts/compare/v3.4.2...v3.4.3) (2021-01-04)



## [3.4.2](https://github.com/nextcloud/contacts/compare/v3.4.1...v3.4.2) (2020-11-18)



## [3.4.1](https://github.com/nextcloud/contacts/compare/v3.4.0...v3.4.1) (2020-10-20)



# [3.4.0](https://github.com/nextcloud/contacts/compare/v3.3.0...v3.4.0) (2020-09-30)



# [3.2.0](https://github.com/nextcloud/contacts/compare/v3.1.9...v3.2.0) (2020-02-29)



## [3.1.9](https://github.com/nextcloud/contacts/compare/v3.1.6...v3.1.9) (2020-02-26)



## [3.1.6](https://github.com/nextcloud/contacts/compare/v3.1.5...v3.1.6) (2019-10-03)



## [3.1.5](https://github.com/nextcloud/contacts/compare/v3.1.4...v3.1.5) (2019-10-03)



## [3.1.4](https://github.com/nextcloud/contacts/compare/v3.1.3...v3.1.4) (2019-09-28)



## [3.1.3](https://github.com/nextcloud/contacts/compare/v3.1.2...v3.1.3) (2019-06-11)



## [3.1.2](https://github.com/nextcloud/contacts/compare/v3.1.1...v3.1.2) (2019-06-10)



## [3.1.1](https://github.com/nextcloud/contacts/compare/v3.1.0...v3.1.1) (2019-04-16)



# [3.1.0](https://github.com/nextcloud/contacts/compare/v3.0.1...v3.1.0) (2019-04-08)



## [3.0.1](https://github.com/nextcloud/contacts/compare/v3.0.0...v3.0.1) (2018-12-24)



# [3.0.0-beta1](https://github.com/nextcloud/contacts/compare/v3.0.0-alpha1...v3.0.0-beta1) (2018-11-14)



## [2.1.6-beta](https://github.com/nextcloud/contacts/compare/v2.1.6...v2.1.6-beta) (2018-08-02)



## [2.1.5](https://github.com/nextcloud/contacts/compare/v2.1.4...v2.1.5) (2018-06-01)


### Reverts

* Revert "Init addressbook disabling ability" ([3455b79](https://github.com/nextcloud/contacts/commit/3455b790b877ac746f974cafb60c6f7f371f13ad))
* Revert "Do not rely on the file type but simply try to parse the given file as vcard - fixes #385" ([b28ef41](https://github.com/nextcloud/contacts/commit/b28ef41c9e47d7c791b29bc8c185067eba359718)), closes [#385](https://github.com/nextcloud/contacts/issues/385)
* Revert "Add support for X-ABLABEL refs #204" ([a4fe8a0](https://github.com/nextcloud/contacts/commit/a4fe8a06a814a216a20e8c861ada446f45a7ffbc)), closes [#204](https://github.com/nextcloud/contacts/issues/204)



