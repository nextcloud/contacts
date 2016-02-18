<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [1.7.8](#178)
- [1.7.7](#177)
- [1.7.6](#176)
- [1.7.5](#175)
- [1.7.4](#174)
- [1.7.3](#173)
- [1.7.2](#172)
- [1.7.0](#170)
- [1.6.5](#165)
- [1.6.4](#164)
- [1.6.3](#163)
- [1.6.2](#162)
- [1.6.1](#161)
- [1.6.0](#160)
- [1.5.5](#155)
- [1.5.4](#154)
- [1.5.3](#153)
- [1.5.2](#152)
- [1.5.1](#151)
- [1.5.0](#150)
- [1.4.1](#141)
- [1.4.0](#140)
- [1.3.0](#130)
- [1.2.0](#120)
- [1.1.2](#112)
- [1.1.1](#111)
- [1.1.0](#110)
- [1.0.4](#104)
- [1.0.3](#103)
- [1.0.2](#102)
- [1.0.1](#101)
- [1.0.0](#100)
- [0.11.0](#0110)
- [0.10.1](#0101)
- [0.10.0](#0100)
- [0.9.3](#093)
- [0.9.2](#092)
- [0.9.1](#091)
- [0.9.0](#090)
- [0.8.0](#080)
- [0.7.1](#071)
- [0.7.0](#070)
- [0.6.0](#060)
- [0.5.0](#050)
- [0.4.0](#040)
- [0.3.1](#031)
- [0.3.0](#030)
- [0.2.0](#020)
- [0.1.0](#010)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

### 1.7.8

+ `listCalendars` passes through all calendars that contain iCalendar
   objects and not just `VEVENT`s.

### 1.7.7

+ Parser processes href and currentUserPrincipal elements

### 1.7.6

+ Bundle `regeneratorRuntime` and polyfills for `Array.prototype.find`
  and `Object.assign` so that consumers don't need babel polyfill.

### 1.7.5

+ Trimmed the binary size to 128k minified
+ Remove babel polyfill
+ Remove handlebars

### 1.7.4

+ Precompile handlebars templates
+ Use custom debug module

### 1.7.3

+ Google CardDAV wasn't working due to a few issues like our url
  comparison, Google requiring at least one filter for an addressbook
  query, and Google sometimes returning propstats with statuses but no
  props.

### 1.7.2

+ Fix outstanding nodejs compatibility issues
+ Expose dav.version

### 1.7.0

+ Remove lodash, json-stringify-safe, don't expose jsonify

### 1.6.5

+ Add brfs as a dependency so that downstream consumers can browserify us

### 1.6.4

+ Workaround https://github.com/substack/brfs/issues/39

### 1.6.3

+ Convert to use new es6/7 features and transpile with babel

### 1.6.2

+ Export debug library under dav ns

### 1.6.1

+ Don't bundle xmlhttprequest polyfill in browser binary... again

### 1.6.0

+ Add #syncCaldavAccount and #syncCarddavAccount to the public api
+ Expose dav.jsonify and dav.ns
+ Small correctness fix to error case in basic calendar sync

### 1.5.5

+ Bundle XMLHttpRequest polyfill for environments where it's not available

### 1.5.4

+ Fix browser globals

### 1.5.3

+ Don't use window in web workers

### 1.5.2

+ Use xmldom in the browser since it's missing from web workers

### 1.5.1

+ Expose dav browserify configuration to npm consumers

### 1.5.0

+ Decouple requests from the urls they get sent to

### 1.4.1

+ Add missing use strict statement to lib/index.js

### 1.4.0

+ New sandbox interface

### 1.3.0

+ Expose dav.Model, dav.Request, dav.Transport

### 1.2.0

+ Implement client#send

### 1.1.2

+ Trick browserify into not bundling node shims for web apis

### 1.1.1

+ %s/toString/jsonify/ for models

### 1.1.0

+ Support for rfc 6352 carddav

### 1.0.4

+ Implement #toString on models

### 1.0.3

+ Internal DELETE, PUT request refactor

### 1.0.2

+ davinci -> dav

### 1.0.1

+ Fix issues with browserify build

### 1.0.0

+ Update interfaces for pluggable transports, expose transport layer
+ Support for oauth2 authentication
+ Clean up internal multistatus parser

### 0.11.0

+ Support for rfc 6578 webdav sync

### 0.10.1

+ Set request depth to 0 in the "getctag" propfind issued during sync

### 0.10.0

+ Implement time-range filters for calendar queries

### 0.9.3

+ Remove dependencies on ical.js and underscore

### 0.9.2

+ Fix npm package
+ Change npm name to davincijs

### 0.9.1

+ remove nodejs polyfills for DOMParser and XMLHttpRequest from build output
+ generate minified binaries

### 0.9.0

+ Implement davinci.Client interface
+ Add transport layer to decouple request details and sending

### 0.8.0

+ Expose low-level request methods through davinci.request
+ Add hook to requests to override transformResponse

### 0.7.1

+ Expose the underlying, xml parsed dav responses on davinci.Calendar and davinci.CalendarObject models.

### 0.7.0

+ Support providing timezone option to #createAccount and #syncCalendar

### 0.6.0

+ #syncCalendar added to public api
+ The promise returned from #createAccount now resolves with a davinci.Account object instead of an array of davinci.Calendar objects.

### 0.5.0

+ #deleteCalendarObject added to public api

### 0.4.0

+ #updateCalendarObject added to public api
+ Internal api refactoring to expose Request objects

### 0.3.1

+ Patch bug in build due to bug in brfs.

### 0.3.0

+ #createCalendarObject modified to support sandboxing.

### 0.2.0

+ #createCalendarObject added to public api

### 0.1.0

+ #createAccount added to public api
+ #createSandbox added to public api
