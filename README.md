# ownCloud Contacts

[![irc](https://img.shields.io/badge/irc%20channel-%23owncloud--contacts%20on%20freenode-blue.svg)](https://webchat.freenode.net/?channels=owncloud-contacts)
[![Build Status](https://scrutinizer-ci.com/g/owncloud/contacts/badges/build.png?b=master)](https://scrutinizer-ci.com/g/owncloud/contacts/build-status/master)
![Dev Dependencies](https://david-dm.org/owncloud/contacts/dev-status.svg)
[![codecov.io](https://codecov.io/github/owncloud/contacts/coverage.svg?branch=master)](https://codecov.io/github/owncloud/contacts?branch=master)

![codecov.io](https://codecov.io/github/owncloud/contacts/branch.svg?branch=master)

**A contacts app for [ownCloud](https://owncloud.org) and [Nextcloud](https://nextcloud.com).**

This is the new contacts app that has replaced the [old contacts app](https://github.com/owncloudarchive/contacts), and is only the frontend for the new server-integrated CardDAV-Backend.

![](https://raw.githubusercontent.com/owncloud/screenshots/master/contacts/contacts.png)

## Maintainers:

- [Thomas Müller](https://github.com/DeepDiver1975)
- [Hendrik Leppelsack](https://github.com/Henni)
- [Jan-Christoph Borchardt](https://github.com/jancborchardt)
- [Alexander Weidinger](https://github.com/irgendwie)
- [Tom Needham](https://github.com/tomneedham)


If you’d like to join, just go through the [issue list](https://github.com/owncloud/contacts/issues) and fix some. :)


## Building the app

The app can be built by using the provided Makefile by running:

    make

This requires the following things to be present:
* make
* which
* tar: for building the archive
* curl: used if phpunit and composer are not installed to fetch them from the web
* npm: for building and testing everything JS


## Publish to App Store

First get an account for the [App Store](http://apps.owncloud.com/) then run:

    make && make appstore

The archive is located in build/artifacts/appstore and can then be uploaded to the App Store.

## Running tests
You can use the provided Makefile to run all tests by using:

    make test

This will run the PHP unit and integration tests and if a package.json is present in the **js/** folder will execute **npm run test**

Of course you can also install [PHPUnit](http://phpunit.de/getting-started.html) and use the configurations directly:

    phpunit -c phpunit.xml

or:

    phpunit -c phpunit.integration.xml

for integration tests
