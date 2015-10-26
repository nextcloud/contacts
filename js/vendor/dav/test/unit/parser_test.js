import { assert } from 'chai';

import { multistatus } from '../../lib/parser';
import data from './data';

suite('parser.multistatus', function() {
  test('propfind (current-user-principal)', function() {
    let currentUserPrincipal = data.currentUserPrincipal;
    assert.deepEqual(multistatus(currentUserPrincipal), {
      response: [{
        href: '/',
        propstat: [{
          prop: {
            currentUserPrincipal: '/principals/admin@domain.tld/'
          },
          status: 'HTTP/1.1 200 OK'
        }]
      }]
    });
  });

  test('report (calendar-query)', function() {
    let calendarQuery = data.calendarQuery;
    assert.deepEqual(multistatus(calendarQuery), {
      response: [
        {
          href: '/calendars/johndoe/home/132456762153245.ics',
          propstat: [{
            prop: {
              getetag: '"2134-314"',
              calendarData: 'BEGIN:VCALENDAR\nEND:VCALENDAR'
            },
            status: 'HTTP/1.1 200 OK'
          }]
        },
        {
          href: '/calendars/johndoe/home/132456-34365.ics',
          propstat: [{
            prop: {
              getetag: '"5467-323"',
              calendarData: 'BEGIN:VCALENDAR\nEND:VCALENDAR'
            },
            status: 'HTTP/1.1 200 OK'
          }]
        },
      ]
    });
  });

  test('report (sync-collection)', function() {
    let syncCollection = data.syncCollection;
    assert.deepEqual(multistatus(syncCollection), {
      response: [{
        href: '/calendars/admin/default/test.ics',
        propstat: [{
          prop: {
            'calendarData': 'BEGIN:VCALENDAR\nEND:VCALENDAR\n',
            getetag: '"e91f3c9518f76753a7dc5a0cf8998986"'
          },
          status: 'HTTP/1.1 200 OK'
        }]
      }],
      syncToken: 'http://sabre.io/ns/sync/3'
    });
  });
});
