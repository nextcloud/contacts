# Contributing

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [Under the hood](#under-the-hood)
- [Running the tests](#running-the-tests)
- [Publishing a release](#publishing-a-release)
- [Related Material](#related-material)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

### Under the hood

dav uses npm to manage external dependencies. External npm modules get bundled into the browser js binary with the (excellent) [browserify](http://browserify.org/) utility. dav uses the `DOMParser` and `XMLHttpRequest` web apis (to parse xml and send http requests). All of the async library operations use es6 [Promises](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise).

### Running the tests

```
///////////////////////////////////////
/ suite       / command               /
///////////////////////////////////////
/ integration / make test-integration /
///////////////////////////////////////
/ lint        / make lint             /
///////////////////////////////////////
/ unit        / make test-unit        /
///////////////////////////////////////
```

Things to note:

+ As of 1.1.1, all of the tests run dav via nodejs. There are no browser tests (yet).
+ You can add helpful debug logs to test output with the `DEBUG` environment variable.
  + Filter logs by setting `DEBUG=dav:*`, `DEBUG=dav:request:*`, etc.
+ Integration tests run against [sabredav](http://sabre.io/)
  + The server code lives [here](https://github.com/gaye/dav/blob/master/test/integration/server/calendarserver.php)
  + There is a make task which downloads a sabredav release from GitHub that `make test-integration` depends on
  + The sabredav instance uses sqlite to store dav collections and objects among other things.
    + The code that seeds the database lives [here](https://github.com/gaye/dav/blob/master/test/integration/server/bootstrap.js)

### Publishing a release

1. Update `package.json` to reflect the new version. Use [semver](http://semver.org/) to help decide what new version number is best.
2. If there are changes to the public api, document them in the README. Then regenerate the `README.md` table of contents with `make toc`.
3. Add a new entry to `HISTORY.md` with the new version number and a description of the changeset. Regenerate the `HISTORY.md` table of contents with `make toc`.
4. Commit the changes to `package.json`, `HISTORY.md`, and (perhaps) `README.md`. Push to GitHub.
5. Run `make && npm publish`.
6. Create a new GitHub release named `v.{MAJOR}.{MINOR}.{PATCH}` with a description of the changeset. Upload the freshly generated zipball `dav.zip`.

### Related Material

+ [Amazing webdav docs](http://sabre.io/dav/)
+ [RFC 4791](http://tools.ietf.org/html/rfc4791)
+ [RFC 5545](http://tools.ietf.org/html/rfc5545)
+ [RFC 6352](http://tools.ietf.org/html/rfc6352)
