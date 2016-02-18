import { assert } from 'chai';
import co from 'co';

import { Request, basic } from '../../../lib/request';
import * as transport from '../../../lib/transport';
import { nockWrapper } from '../nock_wrapper';

suite('put', function() {
  let xhr;

  setup(function() {
    xhr = new transport.Basic({ user: 'admin', password: 'admin' });
  });

  teardown(() => nockWrapper.cleanAll());

  test('should set If-Match header', co.wrap(function *() {
    let mock = nockWrapper('http://127.0.0.1:1337')
      .matchHeader('If-Match', '1337')
      .intercept('/', 'PUT')
      .reply(200);

    let req = basic({
      method: 'PUT',
      etag: '1337'
    });

    let send = xhr.send(req, 'http://127.0.0.1:1337');
    yield mock.verify(send);
  }));

  test('should send options data as request body', co.wrap(function *() {
    let mock = nockWrapper('http://127.0.0.1:1337')
      .matchRequestBody('/', 'PUT', body => {
        return body === 'Bad hair day!';
      });

    let req = basic({
      method: 'PUT',
      data: 'Bad hair day!'
    });

    let send = xhr.send(req, 'http://127.0.0.1:1337');
    yield mock.verify(send);
  }));

  test('should throw error on bad response', co.wrap(function *() {
    nockWrapper('http://127.0.0.1:1337')
      .intercept('/', 'PUT')
      .delay(1)
      .reply('400', '400 Bad Request');

    let req = basic({ method: 'PUT' });

    try {
      yield xhr.send(req, 'http://127.0.0.1:1337')
      assert.fail('request.basic should have thrown an error');
    } catch (error) {
      assert.instanceOf(error, Error);
      assert.include(error.toString(), 'Bad status: 400');
    }
  }));
});
