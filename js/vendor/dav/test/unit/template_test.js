import { assert } from 'chai';

import prop from '../../lib/template/prop';
import filter from '../../lib/template/filter';

suite('template helpers', function() {
  test('comp-filter', function() {
    let item = filter({
      type: 'comp-filter',
      attrs: { name: 'VCALENDAR' }
    });

    assert.strictEqual(item, '<c:comp-filter name="VCALENDAR"/>');
  });

  test('time-range', function() {
    let item = filter({
      type: 'time-range',
      attrs: { start: '20060104T000000Z', end: '20060105T000000Z' }
    });

    assert.strictEqual(
      item,
      '<c:time-range start="20060104T000000Z" end="20060105T000000Z"/>'
    );
  });

  test('time-range no end', function() {
    let item = filter({
      type: 'time-range',
      attrs: { start: '20060104T000000Z' }
    });

    assert.strictEqual(item, '<c:time-range start="20060104T000000Z"/>');
  });

  test('nested', function() {
    let item = filter({
      type: 'comp-filter',
      attrs: { name: 'VCALENDAR' },
      children: [{
        type: 'comp-filter',
        attrs: { name: 'VEVENT' },
        children: [{
          type: 'time-range',
          attrs: { start: '20060104T000000Z', end: '20060105T000000Z' }
        }]
      }]
    });

    assert.strictEqual(
      item.replace(/\s/g, ''),
      ('<c:comp-filter name="VCALENDAR">' +
       '<c:comp-filter name="VEVENT">' +
       '<c:time-range start="20060104T000000Z" end="20060105T000000Z"/>' +
       '</c:comp-filter>' +
       '</c:comp-filter>').replace(/\s/g, '')
    );
  });

  test('prop', function() {
    let item = prop({
      name: 'spongebob',
      namespace: 'urn:ietf:params:xml:ns:caldav'
    });

    assert.strictEqual(item, '<c:spongebob />');
  });
});
