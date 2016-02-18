import { assert } from 'chai';
import co from 'co';

import * as dav from '../../lib';

suite('accounts', function() {
  suite('#create', function() {
    let xhr;

    setup(function() {
      xhr = new dav.transport.Basic(
        new dav.Credentials({
          username: 'admin',
          password: 'admin'
        })
      );
    });

    test('caldav', co.wrap(function *() {
      let account = yield dav.createAccount({
        server: 'http://127.0.0.1:8888',
        xhr: xhr,
        loadObjects: true
      });

      assert.instanceOf(account, dav.Account);
      assert.instanceOf(account.credentials, dav.Credentials);
      assert.strictEqual(account.credentials.username, 'admin');
      assert.strictEqual(account.credentials.password, 'admin');
      assert.strictEqual(account.server, 'http://127.0.0.1:8888');
      assert.strictEqual(account.rootUrl, 'http://127.0.0.1:8888/');
      assert.strictEqual(
        account.principalUrl,
        'http://127.0.0.1:8888/principals/admin/'
      );
      assert.strictEqual(
        account.homeUrl,
        'http://127.0.0.1:8888/calendars/admin/'
      );

      let calendars = account.calendars;
      assert.lengthOf(calendars, 1);
      let calendar = calendars[0];
      assert.instanceOf(calendar, dav.Calendar);
      assert.strictEqual(calendar.displayName, 'default calendar');
      assert.strictEqual(
        calendar.url,
        'http://127.0.0.1:8888/calendars/admin/default/'
      );
      assert.strictEqual(calendar.description, 'administrator calendar');
      assert.include(calendar.components, 'VEVENT');
      assert.typeOf(calendar.ctag, 'string');
      assert.isArray(calendar.objects);
      assert.lengthOf(calendar.objects, 0);
      assert.isArray(calendar.reports);
      assert.include(calendar.reports, 'calendar-query');
      assert.isArray(calendar.resourcetype);
      assert.include(calendar.resourcetype, 'calendar');
      assert.typeOf(calendar.syncToken, 'string');
      assert.operator(calendar.syncToken.length, '>', 0);
    }));

    test('carddav', co.wrap(function *() {
      let account = yield dav.createAccount({
        server: 'http://127.0.0.1:8888',
        xhr: xhr,
        accountType: 'carddav',
        loadObjects: true
      });

      assert.instanceOf(account, dav.Account);
      assert.instanceOf(account.credentials, dav.Credentials);
      assert.strictEqual(account.credentials.username, 'admin');
      assert.strictEqual(account.credentials.password, 'admin');
      assert.strictEqual(account.server, 'http://127.0.0.1:8888');
      assert.strictEqual(account.rootUrl, 'http://127.0.0.1:8888/');
      assert.strictEqual(
        account.principalUrl,
        'http://127.0.0.1:8888/principals/admin/'
      );
      assert.strictEqual(
        account.homeUrl,
        'http://127.0.0.1:8888/addressbooks/admin/'
      );

      let addressBooks = account.addressBooks;
      assert.operator(addressBooks.length, '>', 0);
      let addressBook = addressBooks[0];
      assert.instanceOf(addressBook, dav.AddressBook);
      assert.strictEqual(addressBook.displayName, 'default address book');
      assert.strictEqual(
        addressBook.url,
        'http://127.0.0.1:8888/addressbooks/admin/default/'
      );
      assert.typeOf(addressBook.ctag, 'string');
      assert.isArray(addressBook.objects);
      assert.lengthOf(addressBook.objects, 0);
      assert.isArray(addressBook.reports);
      assert.include(addressBook.reports, 'addressbook-query');
      assert.isArray(addressBook.resourcetype);
      assert.include(addressBook.resourcetype, 'addressbook');
      assert.typeOf(addressBook.syncToken, 'string');
      assert.operator(addressBook.syncToken.length, '>', 0);
    }));

    test('without loading collections', co.wrap(function *() {
      let account = yield dav.createAccount({
        server: 'http://127.0.0.1:8888',
        xhr: xhr,
        accountType: 'caldav',
        loadCollections: false
      });

      assert.instanceOf(account, dav.Account);
      assert.instanceOf(account.credentials, dav.Credentials);
      assert.strictEqual(account.credentials.username, 'admin');
      assert.strictEqual(account.credentials.password, 'admin');
      assert.strictEqual(account.server, 'http://127.0.0.1:8888');
      assert.strictEqual(account.rootUrl, 'http://127.0.0.1:8888/');
      assert.strictEqual(
        account.principalUrl,
        'http://127.0.0.1:8888/principals/admin/'
      );
      assert.strictEqual(
        account.homeUrl,
        'http://127.0.0.1:8888/calendars/admin/'
      );

      let calendars = account.calendars;
      assert.notOk(calendars);
    }));

    test('without loading objects', co.wrap(function *() {
      let account = yield dav.createAccount({
        server: 'http://127.0.0.1:8888',
        xhr: xhr,
        accountType: 'caldav',
        loadObjects: false
      });

      assert.instanceOf(account, dav.Account);
      assert.instanceOf(account.credentials, dav.Credentials);
      assert.strictEqual(account.credentials.username, 'admin');
      assert.strictEqual(account.credentials.password, 'admin');
      assert.strictEqual(account.server, 'http://127.0.0.1:8888');
      assert.strictEqual(account.rootUrl, 'http://127.0.0.1:8888/');
      assert.strictEqual(
        account.principalUrl,
        'http://127.0.0.1:8888/principals/admin/'
      );
      assert.strictEqual(
        account.homeUrl,
        'http://127.0.0.1:8888/calendars/admin/'
      );

      let calendars = account.calendars;
      assert.lengthOf(calendars, 1);
      let calendar = calendars[0];
      assert.instanceOf(calendar, dav.Calendar);
      assert.strictEqual(calendar.displayName, 'default calendar');
      assert.strictEqual(
        calendar.url,
        'http://127.0.0.1:8888/calendars/admin/default/'
      );
      assert.strictEqual(calendar.description, 'administrator calendar');
      assert.include(calendar.components, 'VEVENT');
      assert.typeOf(calendar.ctag, 'string');
      assert.notOk(calendar.objects);
      assert.isArray(calendar.reports);
      assert.include(calendar.reports, 'calendar-query');
      assert.isArray(calendar.resourcetype);
      assert.include(calendar.resourcetype, 'calendar');
      assert.typeOf(calendar.syncToken, 'string');
      assert.operator(calendar.syncToken.length, '>', 0);
    }));
  });
});
