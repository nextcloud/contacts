import { assert } from 'chai';
import co from 'co';

import data from './data';
import * as dav from '../../lib';

let debug = require('../../lib/debug')('dav:contacts_test');

suite('contacts', function() {
  let addressBooks, xhr;

  setup(co.wrap(function *() {
    debug('Create account.');

    xhr = new dav.transport.Basic(
      new dav.Credentials({
        username: 'admin',
        password: 'admin'
      })
    );

    let account = yield dav.createAccount({
      server: 'http://127.0.0.1:8888/',
      xhr: xhr,
      accountType: 'carddav',
      loadObjects: true
    });

    let addressBook = account.addressBooks[0];
    let objects = addressBook.objects;
    assert.isArray(objects);
    assert.lengthOf(objects, 0, 'initially 0 address books');

    debug('Create vcard.');
    yield dav.createCard(addressBook, {
      filename: 'test.vcf',
      data: data.forrestGump,
      xhr: xhr
    });

    let updated = yield dav.syncCarddavAccount(account, {
      syncMethod: 'basic',
      xhr: xhr
    });

    addressBooks = updated.addressBooks;
  }));

  test('#createCard', function() {
    let addressBook = addressBooks[0];
    let objects = addressBook.objects;
    assert.isArray(objects);
    assert.lengthOf(objects, 1);
    let object = objects[0];
    assert.instanceOf(object, dav.VCard);
    assert.instanceOf(object.addressBook, dav.AddressBook);
    assert.strictEqual(
      object.addressData
        .replace(/UID\:[^\n]+\n/, '')
        .replace(/;/g, '')
        .replace(/\s+/g, ''),
      data.forrestGump
        .replace(/;/g, '')
        .replace(/\s+/g, '')
    );
    assert.strictEqual(
      object.url,
      'http://127.0.0.1:8888/addressbooks/admin/default/test.vcf'
    );
  });

  test('#updateCard, #sync', co.wrap(function *() {
    let addressBook = addressBooks[0];
    let object = addressBook.objects[0];
    object.addressData = object.addressData.replace(
      'forrestgump@example.com',
      'lieutenantdan@example.com'
    );

    yield dav.updateCard(object, { xhr: xhr });
    let updated = yield dav.syncAddressBook(addressBook, {
      syncMethod: 'basic',
      xhr: xhr
    });

    let objects = updated.objects;
    assert.isArray(objects);
    assert.lengthOf(objects, 1, 'update should not create new object');
    object = objects[0];
    assert.instanceOf(object, dav.VCard);
    assert.instanceOf(object.addressBook, dav.AddressBook);
    assert.notStrictEqual(
      object.addressData
        .replace(/UID\:[^\n]+\n/, '')
        .replace(/;/g, '')
        .replace(/\s+/g, ''),
      data.forrestGump
        .replace(/;/g, '')
        .replace(/\s+/g, ''),
      'data should have changed on server'
    );
    assert.include(
      object.addressData,
      'lieutenantdan@example.com',
      'data should reflect update'
    );
    assert.notInclude(
      object.addressData,
      'forrestgump@example.com',
      'data should reflect update'
    );
    assert.strictEqual(
      object.url,
      'http://127.0.0.1:8888/addressbooks/admin/default/test.vcf',
      'update should not change object url'
    );
  }));

  test('webdav sync', co.wrap(function *() {
    let addressBook = addressBooks[0];
    let object = addressBook.objects[0];
    object.addressData = object.addressData.replace(
      'forrestgump@example.com',
      'lieutenantdan@example.com'
    );

    let prevEtag = object.etag;
    assert.typeOf(prevEtag, 'string');
    assert.operator(prevEtag.length, '>', 0);

    let prevSyncToken = addressBook.syncToken;
    assert.typeOf(prevSyncToken, 'string');
    assert.operator(prevSyncToken.length, '>', 0);

    yield dav.updateCard(object, { xhr: xhr });
    let updated = yield dav.syncAddressBook(addressBook, {
      syncMethod: 'webdav',
      xhr: xhr
    });

    let objects = updated.objects;
    assert.isArray(objects);
    assert.lengthOf(objects, 1, 'update should not create new object');

    object = objects[0];
    assert.instanceOf(object, dav.VCard);
    assert.instanceOf(object.addressBook, dav.AddressBook);

    assert.notStrictEqual(
      object.addressData
        .replace(/UID\:[^\n]+\n/, '')
        .replace(/;/g, '')
        .replace(/\s+/g, ''),
      data.forrestGump
        .replace(/;/g, '')
        .replace(/\s+/g, ''),
      'data should have changed on server'
    );
    assert.include(
      object.addressData,
      'lieutenantdan@example.com',
      'data should reflect update'
    );
    assert.notInclude(
      object.addressData,
      'forrestgump@example.com',
      'data should reflect update'
    );
    assert.notStrictEqual(
      object.addressData,
      data.bastilleDayParty,
      'data should have changed on server'
    );

    assert.typeOf(object.etag, 'string');
    assert.operator(object.etag.length, '>', 0);
    assert.notStrictEqual(prevEtag, object.etag, 'new etag');

    assert.typeOf(addressBook.syncToken, 'string');
    assert.operator(addressBook.syncToken.length, '>', 0);
    assert.notStrictEqual(addressBook.syncToken, prevSyncToken, 'new token');
  }));

  test('#deleteCard', co.wrap(function *() {
    let addressBook = addressBooks[0];
    let objects = addressBook.objects;
    assert.isArray(objects);
    assert.lengthOf(objects, 1);
    let object = objects[0];
    yield dav.deleteCard(object, { xhr: xhr });
    let updated = yield dav.syncAddressBook(addressBook, {
      syncMethod: 'basic',
      xhr: xhr
    });

    objects = addressBook.objects;
    assert.isArray(objects);
    assert.lengthOf(objects, 0, 'should be deleted');
  }));

  test('#syncCarddavAccount', co.wrap(function *() {
    let account = yield dav.createAccount({
      server: 'http://127.0.0.1:8888/',
      xhr: xhr,
      accountType: 'carddav',
      loadCollections: false
    });

    assert.instanceOf(account, dav.Account);
    assert.notOk(account.addressBooks);
    let updated = yield dav.syncCarddavAccount(account, { xhr: xhr });
    assert.instanceOf(updated, dav.Account);
    assert.isArray(updated.addressBooks);
    assert.lengthOf(updated.addressBooks, 1);
    let addressBook = addressBooks[0];
    assert.instanceOf(addressBook, dav.AddressBook);
    assert.strictEqual(addressBook.displayName, 'default address book');
  }));
});
