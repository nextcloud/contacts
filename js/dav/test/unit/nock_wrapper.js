/**
 * @fileoverview Decorates nock with some useful utilities.
 */
import { assert } from 'chai';
import co from 'co';
import nock from 'nock';

export function nockWrapper(url) {
  let result = nock(url);

  // This is a hack suggested here https://github.com/pgte/nock#protip
  // to intercept the request conditional on the request body.
  result.matchRequestBody = (path, method, match, options={}) => {
    let statusCode = options.statusCode || 200;
    let statusText = options.statusText || '200 OK';
    return result
      .filteringRequestBody(body => match(body) ? '*' : '')
      .intercept(path, method, '*')
      .delay(1)
      .reply(statusCode, statusText);
  };

  /**
   * Whether or not an error is thrown in the promise,
   * the mock should have intercepted the request.
   */
  result.verify = co.wrap(function *(promise) {
    try {
      yield promise;
    } catch (error) {
      assert.notInclude(error.toString(), 'ECONNREFUSED');
    } finally {
      result.done();
    }
  });

  return result;
}

Object.keys(nock).forEach(key => {
  let value = nock[key];
  if (typeof value !== 'function') {
    return;
  }

  nockWrapper[key] = value.bind(nockWrapper)
});
