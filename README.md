# Nextcloud Contacts

![Downloads](https://img.shields.io/github/downloads/nextcloud/contacts/total.svg)
[![irc](https://img.shields.io/badge/IRC-%23nextcloud--contacts%20on%20freenode-blue.svg)](https://webchat.freenode.net/?channels=nextcloud-contacts)
[![Build Status](https://travis-ci.org/nextcloud/contacts.svg?branch=master)](https://travis-ci.org/nextcloud/contacts)
[![Code coverage](https://img.shields.io/codecov/c/github/nextcloud/contacts.svg?maxAge=2592000)](https://codecov.io/gh/nextcloud/contacts/)

**A contacts app for [Nextcloud](https://nextcloud.com). Easily sync contacts from various devices with your Nextcloud and edit them online.**

This app only support vCard **3.0** and **4.0**

![](https://raw.githubusercontent.com/nextcloud/screenshots/master/apps/Contacts/contacts.png)

## :blue_heart: :tada: Why is this so awesome?

* :rocket: **Integration with other Nextcloud apps!** Currently Mail and Calendar – more to come.
* :tada: **Never forget a birthday!** You can sync birthdays and other recurring events with your Nextcloud Calendar.
* :busts_in_silhouette: **Sharing of Adressbooks!** You want to share your contacts with your friends or coworkers? No problem!
* :see_no_evil: **We’re not reinventing the wheel!** Based on the great and open SabreDAV library.

## :hammer_and_wrench: Installation

In your Nextcloud, simply navigate to "Apps", choose the category "Organization", find the Contacts app and enable it.
Then open the Contacts app from the app menu.

## :satellite: Support

If you need assistance or want to ask a question about Contacts, you are welcome to [ask for support](https://help.nextcloud.com) in our Forums or the [IRC-Channel](https://webchat.freenode.net/?channels=nextcloud-contacts). If you have found a bug, feel free to open a new Issue on GitHub. Keep in mind, that this repository only manages the frontend. If you find bugs or have problems with the CardDAV-Backend, you should ask the team at [Nextcloud server](https://github.com/nextcloud/server) for help!

## Maintainers:

- [John Molakvoæ](https://github.com/skjnldsv)

If you'd like to join, just go through the [issue list](https://github.com/nextcloud/contacts/issues) and fix some. :)

### Nightly builds

Instead of setting everything up manually, you can just [download the nightly builds](https://nightly.portknox.net/contacts/?C=M;O=D) instead. These builds are updated every 24 hours, and are pre-configured with all the needed dependencies.

1. Download
2. Extract the tar archive to 'path-to-nextcloud/apps'
3. Navigate to »Apps«, choose the category »Productivity«, find the Contacts app and enable it.

The nightly builds are provided by [Portknox.net](https://portknox.net)

## Build the app

``` bash
# set up and build for production
make

# install dependencies
make dev-setup

# build for dev and watch changes
make watch-js

# build for dev
make build-js

# build for production with minification
make build-js-production
```

## :v: Code of conduct

The Nextcloud community has core values that are shared between all members during conferences,
hackweeks and on all interactions in online platforms including [Github](https://github.com/nextcloud) and [Forums](https://help.nextcloud.com).
If you contribute, participate or interact with this community, please respect [our shared values](https://nextcloud.com/code-of-conduct/). :relieved:

## :heart: How to create a pull request

This guide will help you get started: 
- :dancer: :smile: [Opening a pull request](https://opensource.guide/how-to-contribute/#opening-a-pull-request) 





