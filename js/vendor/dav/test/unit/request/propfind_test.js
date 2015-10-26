import { assert } from 'chai';
import co from 'co';

import * as namespace from '../../../lib/namespace';
import { Request, propfind } from '../../../lib/request';
import * as transport from '../../../lib/transport';
import data from '../data';
import { nockWrapper } from '../nock_wrapper';

suite('request.propfind', function() {
  let xhr;

  setup(function() {
    xhr = new transport.Basic({ user: 'admin', password: 'admin' });
  });

  teardown(() => nockWrapper.cleanAll());

  test('should set depth header', co.wrap(function *() {
    let mock = nockWrapper('http://127.0.0.1:1337')
      .matchHeader('Depth', '0')  // Will only get intercepted if Depth => 0.
      .intercept('/', 'PROPFIND')
      .reply(200);

    let req = propfind({
      props: [ { name: 'catdog', namespace: namespace.DAV } ],
      depth: '0'
    });

    let send = xhr.send(req, 'http://127.0.0.1:1337');
    yield mock.verify(send);
  }));

  test('should add specified properties to propfind body', co.wrap(function *() {
    let mock = nockWrapper('http://127.0.0.1:1337')
      .matchRequestBody('/', 'PROPFIND', function(body) {
        return body.indexOf('<d:catdog />') !== -1;
      });

    let req = propfind({
      props: [ { name: 'catdog', namespace: namespace.DAV } ],
      depth: '0'
    });

    let send = xhr.send(req, 'http://127.0.0.1:1337');
    yield mock.verify(send);
  }));

  test('should resolve with appropriate data structure', co.wrap(function *() {
    nockWrapper('http://127.0.0.1:1337')
      .intercept('/', 'PROPFIND')
      .reply(200, data.propfind);

    let req = propfind({
      props: [
        { name: 'displayname', namespace: namespace.DAV },
        { name: 'getctag', namespace: namespace.CALENDAR_SERVER },
        {
          name: 'supported-calendar-component-set',
          namespace: namespace.CALDAV
        }
      ],
      depth: 1
    });

    let responses = yield xhr.send(req, 'http://127.0.0.1:1337/');

    assert.isArray(responses);
    responses.forEach(response => {
      assert.typeOf(response.href, 'string');
      assert.operator(response.href.length, '>', 0);
      assert.ok('props' in response);
      assert.typeOf(response.props, 'object');
      if ('displayname' in response.props) {
        assert.typeOf(response.props.displayname, 'string');
        assert.operator(response.props.displayname.length, '>', 0);
      }
      if ('components' in response.props) {
        assert.isArray(response.props.components);
        assert.include(response.props.components, 'VEVENT');
      }
    });
  }));
});
