import { assert } from 'chai';
import co from 'co';

import * as ns from '../../../lib/namespace';
import { Request, calendarQuery } from '../../../lib/request';
import * as transport from '../../../lib/transport';
import data from '../data';
import { nockWrapper } from '../nock_wrapper';

suite('request.calendarQuery', function() {
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

    let req = calendarQuery({
      props: [ { name: 'calendar-data', namespace: ns.CALDAV } ],
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

    let req = calendarQuery({
      props: [ { name: 'catdog', namespace: ns.DAV } ]
    });

    let send = xhr.send(req, 'http://127.0.0.1:1337/principals/admin/');
    yield mock.verify(send);
  }));

  test('should add specified filters to report body', co.wrap(function *() {
    let mock = nockWrapper('http://127.0.0.1:1337')
      .matchRequestBody('/principals/admin/', 'REPORT', body => {
        return body.indexOf('<c:comp-filter name="VCALENDAR"/>') !== -1;
      });

    let req = calendarQuery({
      filters: [{
        type: 'comp-filter',
        attrs: { name: 'VCALENDAR' },
      }]
    });

    let send = xhr.send(req, 'http://127.0.0.1:1337/principals/admin/');
    yield mock.verify(send);
  }));

  test('should add timezone to report body', co.wrap(function *() {
    let mock = nockWrapper('http://127.0.0.1:1337')
      .matchRequestBody('/principals/admin/', 'REPORT', body => {
        let data = '<c:timezone>BEGIN:VTIMEZONE\nEND:VTIMEZONE</c:timezone>';
        return body.indexOf(data) !== -1;
      });

    let req = calendarQuery({
      url: 'http://127.0.0.1:1337/principals/admin/',
      timezone: 'BEGIN:VTIMEZONE\nEND:VTIMEZONE'
    });

    let send = xhr.send(req, 'http://127.0.0.1:1337/principals/admin/');
    yield mock.verify(send);
  }));

  test('should resolve with appropriate data structure', co.wrap(function *() {
    nockWrapper('http://127.0.0.1:1337')
      .intercept('/', 'REPORT')
      .reply(200, data.calendarQuery);

    let req = calendarQuery({
      props: [
        { name: 'getetag', namespace: ns.DAV },
        { name: 'calendar-data', namespace: ns.CALDAV }
      ],
      filters: [ { type: 'comp', attrs: { name: 'VCALENDAR' } } ]
    });

    let calendars = yield xhr.send(req, 'http://127.0.0.1:1337/');
    assert.lengthOf(calendars, 2);
    calendars.forEach(calendar => {
      assert.typeOf(calendar.href, 'string');
      assert.operator(calendar.href.length, '>', 0);
      assert.include(calendar.href, '.ics');
      assert.typeOf(calendar.props, 'object');
      assert.typeOf(calendar.props.getetag, 'string');
      assert.operator(calendar.props.getetag.length, '>', 0);
      assert.typeOf(calendar.props.calendarData, 'string');
      assert.operator(calendar.props.calendarData.length, '>', 0);
    });
  }));
});
