import { assert } from 'chai';
import co from 'co';
import nock from 'nock';
import sinon from 'sinon';

import { Credentials } from '../../lib/model';
import { createSandbox } from '../../lib/sandbox';
import { Basic, OAuth2 } from '../../lib/transport';
import XMLHttpRequest from '../../lib/xmlhttprequest';

suite('Basic#send', function() {
  let xhr, req;

  setup(function() {
    xhr = new Basic(
      new Credentials({ username: 'admin', password: 'admin' })
    );

    req = {
      method: 'GET',
      transformRequest: xhr => xhr
    };
  });

  teardown(function() {
    nock.cleanAll();
  });

  test('should sandbox xhr', function() {
    let sandbox = createSandbox();
    assert.lengthOf(sandbox.requestList, 0);
    xhr.send(req, 'http://127.0.0.1:1337', { sandbox: sandbox });
    assert.lengthOf(sandbox.requestList, 1);
  });

  test('should apply `transformRequest`', function() {
    let stub = sinon.stub(req, 'transformRequest');
    xhr.send(req, 'http://127.0.0.1:1337');
    sinon.assert.called(stub);
    stub.restore();
  });

  test('should send req', co.wrap(function *() {
    let nockObj = nock('http://127.0.0.1:1337')
      .get('/')
      .reply(200, '200 OK');

    assert.notOk(nockObj.isDone());
    yield xhr.send(req, 'http://127.0.0.1:1337');
    assert.ok(nockObj.isDone());
  }));

  test('should invoke onerror if error thrown', function(done) {
    nock('http://127.0.0.1:1337')
      .get('/')
      .reply(400, '400 Bad Request');

    req.onerror = function(error) {
      assert.instanceOf(error, Error);
      assert.include(error.toString(), 'Bad status: 400');
      done();
    };

    xhr.send(req, 'http://127.0.0.1:1337');
  });

  test('should return promise that resolves with xhr', co.wrap(function *() {
    nock('http://127.0.0.1:1337')
      .get('/')
      .reply(200, '200 OK');

    let value = yield xhr.send(req, 'http://127.0.0.1:1337');
    assert.instanceOf(value, XMLHttpRequest);
    assert.strictEqual(value.request.readyState, 4);
  }));
});

suite('OAuth2#send', function() {
  let xhr, req, credentials;

  setup(function() {
    credentials = new Credentials({
      clientId: '605300196874-1ki833poa7uqabmh3hq' +
                '6u1onlqlsi54h.apps.googleusercontent.com',
      clientSecret: 'jQTKlOhF-RclGaGJot3HIcVf',
      redirectUrl: 'https://oauth.gaiamobile.org/authenticated',
      tokenUrl: 'https://accounts.google.com/o/oauth2/token',
      authorizationCode: 'gareth'
    });

    xhr = new OAuth2(credentials);

    req = { method: 'GET' };
  });

  teardown(function() {
    nock.cleanAll();
  });

  test('should get access token', co.wrap(function *() {
    let access = nock('https://accounts.google.com')
      .post('/o/oauth2/token')
      .reply(
        200,
        JSON.stringify({
          access_token: 'sosafesosecret',
          refresh_token: 'lemonade!!1',
          expires_in: 12345
        })
      );

    let mock = nock('http://127.0.0.1:1337')
      .get('/')
      .matchHeader('Authorization', 'Bearer sosafesosecret')
      .reply(200);

    let response = yield xhr.send(req, 'http://127.0.0.1:1337', {
      retry: false
    });

    assert.instanceOf(response, XMLHttpRequest);
    assert.ok(access.isDone(), 'should get access');
    assert.strictEqual(credentials.accessToken, 'sosafesosecret');
    assert.strictEqual(credentials.refreshToken, 'lemonade!!1');
    assert.operator(credentials.expiration, '>', Date.now());
    assert.ok(mock.isDone(), 'should send req with Authorization header');
  }));

  test('should refresh access token if expired', co.wrap(function *() {
    let refresh = nock('https://accounts.google.com')
      .post('/o/oauth2/token')
      .reply(
        200,
        JSON.stringify({
          access_token: 'Little Bear',
          expires_in: 314159
        })
      );

    let mock = nock('http://127.0.0.1:1337')
      .get('/')
      .matchHeader('Authorization', 'Bearer Little Bear')
      .reply(200, '200 OK');

    credentials.accessToken = 'EXPIRED';
    credentials.refreshToken = '1/oPHTPFgECWFPrs7KgHdis24u6Xl4E4EnRrkkiwLfzdk';
    credentials.expiration = Date.now() - 1;

    let response = yield xhr.send(req, 'http://127.0.0.1:1337', {
      retry: false
    });

    assert.instanceOf(response, XMLHttpRequest);
    assert.ok(refresh.isDone(), 'should refresh');
    assert.strictEqual(credentials.accessToken, 'Little Bear');
    assert.typeOf(credentials.expiration, 'number');
    assert.operator(credentials.expiration, '>', Date.now());
    assert.ok(mock.isDone(), 'should send req with Authorization header');
  }));

  test('should use provided access token if not expired', co.wrap(function *() {
    let token = nock('https://accounts.google.com')
      .post('/o/oauth2/token')
      .reply(500);

    let mock = nock('http://127.0.0.1:1337')
      .get('/')
      .matchHeader('Authorization', 'Bearer Little Bear')
      .reply(200, '200 OK');

    credentials.accessToken = 'Little Bear';
    credentials.refreshToken = 'spicy tamales';
    let expiration = credentials.expiration = Date.now() + 60 * 60 * 1000;

    let response = yield xhr.send(req, 'http://127.0.0.1:1337', {
      retry: false
    });

    assert.instanceOf(response, XMLHttpRequest);
    assert.notOk(token.isDone(), 'should not fetch new token(s)');
    assert.strictEqual(credentials.accessToken, 'Little Bear');
    assert.strictEqual(credentials.refreshToken, 'spicy tamales');
    assert.strictEqual(expiration, credentials.expiration);
    assert.ok(mock.isDone());
  }));

  test('should retry if 401', co.wrap(function *() {
    let refresh = nock('https://accounts.google.com')
      .post('/o/oauth2/token')
      .reply(
        200,
        JSON.stringify({
          access_token: 'Little Bear',
          expires_in: 314159
        })
      );

    let authorized = nock('http://127.0.0.1:1337')
      .get('/')
      .matchHeader('Authorization', 'Bearer Little Bear')
      .reply(200, '200 OK');

    let unauthorized = nock('http://127.0.0.1:1337')
      .get('/')
      .matchHeader('Authorization', 'Bearer EXPIRED')
      .reply(401, '401 Unauthorized');

    credentials.accessToken = 'EXPIRED';
    credentials.refreshToken = 'raspberry pie';
    credentials.expiration = Date.now() + 60 * 60 * 1000;

    let response = yield xhr.send(req, 'http://127.0.0.1:1337');
    assert.instanceOf(response, XMLHttpRequest);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.responseText, '200 OK');
    assert.ok(unauthorized.isDone(), 'tried to use expired access token');
    assert.ok(refresh.isDone(), 'should refresh access token on 401');
    assert.strictEqual(credentials.accessToken, 'Little Bear');
    assert.operator(credentials.expiration, '>', Date.now());
    assert.ok(authorized.isDone(), 'should then use new access token');
  }));

  test('should retry once at most', co.wrap(function *() {
    let refresh = nock('https://accounts.google.com')
      .post('/o/oauth2/token')
      .reply(
        200,
        JSON.stringify({
          access_token: 'EXPIRED',
          expires_in: 314159
        })
      );

    nock('http://127.0.0.1:1337')
      .persist()
      .get('/')
      .matchHeader('Authorization', 'Bearer EXPIRED')
      .reply(401, '401 Unauthorized');

    credentials.accessToken = 'EXPIRED';
    credentials.refreshToken = 'soda';

    let spy = sinon.spy(xhr, 'send');

    try {
      yield xhr.send(req, 'http://127.0.0.1:1337')
      assert.fail('Should have failed on error');
    } catch (error) {
      assert.instanceOf(error, Error);
      assert.include(error.toString(), 'Bad status: 401');
      assert.ok(refresh.isDone(), 'should refresh access token on 401');
      assert.strictEqual(spy.callCount, 2);
      spy.restore();
    }
  }));
});
