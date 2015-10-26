import { assert } from 'chai';
import co from 'co';

import * as namespace from '../../../lib/namespace';
import { Request, syncCollection } from '../../../lib/request';
import * as transport from '../../../lib/transport';
import { nockWrapper } from '../nock_wrapper';

suite('request.syncCollection', function() {
  let xhr;

  setup(function() {
    xhr = new transport.Basic({ username: 'admin', password: 'admin' });
  });

  teardown(() => nockWrapper.cleanAll());

  test('should add props to request body', co.wrap(function *() {
    let mock = nockWrapper('http://127.0.0.1:1337')
      .matchRequestBody(
        '/principals/admin/default/',
        'REPORT',
        body => {
          return body.indexOf('<d:getetag />') !== -1 &&
                 body.indexOf('<c:calendar-data />') !== -1;
        }
      );

    let req = syncCollection({
      syncLevel: 1,
      syncToken: 'abc123',
      props: [
        { name: 'getetag', namespace: namespace.DAV },
        { name: 'calendar-data', namespace: namespace.CALDAV }
      ]
    });

    let send = xhr.send(req, 'http://127.0.0.1:1337/principals/admin/default/');
    yield mock.verify(send);
  }));

  test('should set sync details in request body', co.wrap(function *() {
    let mock = nockWrapper('http://127.0.0.1:1337')
      .matchRequestBody(
        '/principals/admin/default/',
        'REPORT',
        body => {
          return body.indexOf('<d:sync-level>1</d:sync-level>') !== -1 &&
                 body.indexOf('<d:sync-token>abc123</d:sync-token>') !== -1;
        }
      );

    let req = syncCollection({
      syncLevel: 1,
      syncToken: 'abc123',
      props: [
        { name: 'getetag', namespace: namespace.DAV },
        { name: 'calendar-data', namespace: namespace.CALDAV }
      ]
    });

    let send = xhr.send(req, 'http://127.0.0.1:1337/principals/admin/default/');
    yield mock.verify(send);
  }));
});
