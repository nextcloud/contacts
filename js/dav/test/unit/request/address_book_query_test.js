import { assert } from 'chai';
import co from 'co';

import * as ns from '../../../lib/namespace';
import { Request, addressBookQuery } from '../../../lib/request';
import * as transport from '../../../lib/transport';
import data from '../data';
import { nockWrapper } from '../nock_wrapper';

suite('request.addressBookQuery', function() {
  let xhr;

  setup(function() {
    xhr = new transport.Basic({ username: 'admin', password: 'admin' });
  });

  teardown(() => nockWrapper.cleanAll());

  test('should set depth header', co.wrap(function *() {
    let mock = nockWrapper('http://127.0.0.1:1337')
      .matchHeader('Depth', 1)
      .intercept('/principals/admin/', 'REPORT')
      .reply(200);

    let req = addressBookQuery({
      props: [ { name: 'address-data', namespace: ns.CARDDAV } ],
      depth: 1
    });

    let send = xhr.send(req, 'http://127.0.0.1:1337/principals/admin/');
    yield mock.verify(send);
  }));

  test('should add specified props to report body', co.wrap(function *() {
    let mock = nockWrapper('http://127.0.0.1:1337')
      .matchRequestBody('/principals/admin/', 'REPORT', body => {
        return body.indexOf('<d:catdog />') !== -1;
      });

    let req = addressBookQuery({
      props: [ { name: 'catdog', namespace: ns.DAV } ]
    });

    let send = xhr.send(req, 'http://127.0.0.1:1337/principals/admin/');
    yield mock.verify(send);
  }));

  test('should resolve with appropriate data structure', co.wrap(function *() {
    nockWrapper('http://127.0.0.1:1337')
      .intercept('/', 'REPORT')
      .reply(200, data.addressBookQuery);


    let req = addressBookQuery({
      props: [
        { name: 'getetag', namespace: ns.DAV },
        { name: 'address-data', namespace: ns.CARDDAV }
      ]
    });

    let addressBooks = yield xhr.send(req, 'http://127.0.0.1:1337');
    assert.lengthOf(addressBooks, 2);
    addressBooks.forEach(addressBook => {
      assert.typeOf(addressBook.href, 'string');
      assert.operator(addressBook.href.length, '>', 0);
      assert.typeOf(addressBook.props, 'object');
    });
  }));
});
