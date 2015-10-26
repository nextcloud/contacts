import { assert } from 'chai';
import sinon from 'sinon';

import * as dav from '../../lib';
import { Sandbox, createSandbox } from '../../lib/sandbox';
import XMLHttpRequest from '../../lib/xmlhttprequest';

suite('sandbox', function() {
  let sandbox;

  setup(function() {
    sandbox = createSandbox();
  });

  test('#add', function() {
    assert.lengthOf(sandbox.requestList, 0);
    let one = new XMLHttpRequest(),
        two = new XMLHttpRequest();
    sandbox.add(one);
    sandbox.add(two);
    assert.lengthOf(sandbox.requestList, 2);
    assert.include(sandbox.requestList, one);
    assert.include(sandbox.requestList, two);
  });

  test('#abort', function() {
    let one = new XMLHttpRequest(),
        two = new XMLHttpRequest();
    sandbox.add(one);
    sandbox.add(two);
    let stubOne = sinon.stub(one, 'abort'),
        stubTwo = sinon.stub(two, 'abort');
    sandbox.abort();
    sinon.assert.calledOnce(stubOne);
    sinon.assert.calledOnce(stubTwo);
  });
});

suite('new sandbox object interface', function() {
  let sandbox;

  setup(function() {
    sandbox = new Sandbox();
  });

  test('constructor', function() {
    assert.instanceOf(sandbox, Sandbox);
  });

  test('#add', function() {
    assert.lengthOf(sandbox.requestList, 0);
    let one = new XMLHttpRequest(),
        two = new XMLHttpRequest();
    sandbox.add(one);
    sandbox.add(two);
    assert.lengthOf(sandbox.requestList, 2);
    assert.include(sandbox.requestList, one);
    assert.include(sandbox.requestList, two);
  });

  test('#abort', function() {
    let one = new XMLHttpRequest(),
        two = new XMLHttpRequest();
    sandbox.add(one);
    sandbox.add(two);
    let stubOne = sinon.stub(one, 'abort'),
        stubTwo = sinon.stub(two, 'abort');
    sandbox.abort();
    sinon.assert.calledOnce(stubOne);
    sinon.assert.calledOnce(stubTwo);
  });
});
