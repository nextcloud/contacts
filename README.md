# Nextcloud Contacts
![Downloads](https://img.shields.io/github/downloads/nextcloud/contacts/total.svg?style=flat-square)
[![Code coverage](https://img.shields.io/codecov/c/github/nextcloud/contacts.svg?style=flat-square)](https://codecov.io/gh/nextcloud/contacts/)
[![Dependabot status](https://img.shields.io/badge/Dependabot-enabled-brightgreen.svg?longCache=true&style=flat-square&logo=dependabot)](https://dependabot.com)

**A contacts app for [Nextcloud](https://nextcloud.com). Easily sync contacts from various devices with your Nextcloud and edit them online.**

This app only support vCard **3.0** and **4.0**. This app is compatible with the same browsers as server **except IE**!

![](https://raw.githubusercontent.com/nextcloud/screenshots/master/apps/Contacts/contacts.png)

## :blue_heart: :tada: Why is this so awesome?

* :rocket: **Integration with other Nextcloud apps!** Currently Mail and Calendar – more to come.
* :tada: **Never forget a birthday!** You can sync birthdays and other recurring events with your Nextcloud Calendar.
* :busts_in_silhouette: **Sharing of address books!** You want to share your contacts with your friends or coworkers? No problem!
* :see_no_evil: **We’re not reinventing the wheel!** Based on the great and open SabreDAV library.

## :hammer_and_wrench: Installation

The app is distributed through the [app store](https://apps.nextcloud.com/apps/contacts) and you can install it [right from your Nextcloud installation](https://docs.nextcloud.com/server/stable/admin_manual/apps_management.html).

Release tarballs are hosted at https://github.com/nextcloud-releases/contacts/releases.

## :satellite: Support

If you need assistance or want to ask a question about Contacts, you are welcome to [ask for support](https://help.nextcloud.com) in our Forums or the [IRC-Channel](https://webchat.freenode.net/?channels=nextcloud-contacts). If you have found a bug, feel free to open a new Issue on GitHub. Keep in mind, that this repository only manages the frontend. If you find bugs or have problems with the CardDAV-Backend, you should ask the team at [Nextcloud server](https://github.com/nextcloud/server) for help!

### Could you add XXX property?
> This is a complicated answer. We did not invent the way contacts works. We are following the official vCard format. This format include a predefined set of properties that other applications/devices supports too (Android, iOS, Windows, Gnome...). Adding a custom property would just make it compatible with Nextcloud and will not be understood by any other clients and make it complicated for us to ensure its sustainability over time.
Long story short, we suggest you use the Notes field to add your custom data :)

If you'd like to join, just go through the [issue list](https://github.com/nextcloud/contacts/issues) and fix some. :)

## Build the app

``` bash
# set up and build for production
npm ci
npm run build

# install dependencies
npm ci

# build for dev and watch changes
npm run watch

# build for dev
npm run dev

# build for production with minification
npm run build

```
## Running tests
You can run all front-end tests by using:

```
# run tests once
npm run test

# run tests continuously after every change
npm run test:watch
```

## :v: Code of conduct

The Nextcloud community has core values that are shared between all members during conferences,
hackweeks and on all interactions in online platforms including [Github](https://github.com/nextcloud) and [Forums](https://help.nextcloud.com).
If you contribute, participate or interact with this community, please respect [our shared values](https://nextcloud.com/code-of-conduct/). :relieved:

## :heart: How to create a pull request

This guide will help you get started: 
- :dancer: :smile: [Opening a pull request](https://opensource.guide/how-to-contribute/#opening-a-pull-request) 

## Thanks
- language icon by [nociconist](https://thenounproject.com/nociconist/)



