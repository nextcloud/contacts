import co from 'co';
import url from 'url';

import fuzzyUrlEquals from './fuzzy_url_equals';
import { Calendar, CalendarObject } from './model';
import * as ns from './namespace';
import * as request from './request';
import * as webdav from './webdav';

let debug = require('./debug')('dav:calendars');

const ICAL_OBJS = new Set([
  'VEVENT',
  'VTODO',
  'VJOURNAL',
  'VFREEBUSY',
  'VTIMEZONE',
  'VALARM'
]);

/**
 * @param {dav.Account} account to fetch calendars for.
 */
export let listCalendars = co.wrap(function *(account, options) {
  debug(`Fetch calendars from home url ${account.homeUrl}`);
  var req = request.propfind({
    props: [
      { name: 'calendar-description', namespace: ns.CALDAV },
      { name: 'calendar-timezone', namespace: ns.CALDAV },
      { name: 'displayname', namespace: ns.DAV },
      { name: 'getctag', namespace: ns.CALENDAR_SERVER },
      { name: 'resourcetype', namespace: ns.DAV },
      { name: 'supported-calendar-component-set', namespace: ns.CALDAV },
      { name: 'sync-token', namespace: ns.DAV }
    ],
    depth: 1
  });

  let responses = yield options.xhr.send(req, account.homeUrl, {
    sandbox: options.sandbox
  });

  debug(`Found ${responses.length} calendars.`);
  let cals = responses
    .filter(res => {
      // We only want the calendar if it contains iCalendar objects.
      let components = res.props.supportedCalendarComponentSet || [];
      return components.reduce((hasObjs, component) => {
          return hasObjs || ICAL_OBJS.has(component)
      }, false)
    })
    .map(res => {
      debug(`Found calendar ${res.props.displayname},
             props: ${JSON.stringify(res.props)}`);
      return new Calendar({
        data: res,
        account: account,
        description: res.props.calendarDescription,
        timezone: res.props.calendarTimezone,
        url: url.resolve(account.rootUrl, res.href),
        ctag: res.props.getctag,
        displayName: res.props.displayname,
        components: res.props.supportedCalendarComponentSet,
        resourcetype: res.props.resourcetype,
        syncToken: res.props.syncToken
      });
    });

  yield cals.map(co.wrap(function *(cal) {
    cal.reports = yield webdav.supportedReportSet(cal, options);
  }));

  return cals;
});

/**
 * @param {dav.Calendar} calendar the calendar to put the object on.
 * @return {Promise} promise will resolve when the calendar has been created.
 *
 * Options:
 *
 *   (String) data - rfc 5545 VCALENDAR object.
 *   (String) filename - name for the calendar ics file.
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */
export function createCalendarObject(calendar, options) {
  var objectUrl = url.resolve(calendar.url, options.filename);
  return webdav.createObject(objectUrl, options.data, options);
};

/**
 * @param {dav.CalendarObject} calendarObject updated calendar object.
 * @return {Promise} promise will resolve when the calendar has been updated.
 *
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */
export function updateCalendarObject(calendarObject, options) {
  return webdav.updateObject(
    calendarObject.url,
    calendarObject.calendarData,
    calendarObject.etag,
    options
  );
}

/**
 * @param {dav.CalendarObject} calendarObject target calendar object.
 * @return {Promise} promise will resolve when the calendar has been deleted.
 *
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */
export function deleteCalendarObject(calendarObject, options) {
  return webdav.deleteObject(
    calendarObject.url,
    calendarObject.etag,
    options
  );
}

/**
 * @param {dav.Calendar} calendar the calendar to fetch objects for.
 *
 * Options:
 *
 *   (Array.<Object>) filters - optional caldav filters.
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */
export let listCalendarObjects = co.wrap(function *(calendar, options) {
  debug(`Doing REPORT on calendar ${calendar.url} which belongs to
         ${calendar.account.credentials.username}`);

  let filters = options.filters || [{
    type: 'comp-filter',
    attrs: { name: 'VCALENDAR' },
    children: [{
      type: 'comp-filter',
      attrs: { name: 'VEVENT' }
    }]
  }];

  let req = request.calendarQuery({
    depth: 1,
    props: [
      { name: 'getetag', namespace: ns.DAV },
      { name: 'calendar-data', namespace: ns.CALDAV }
    ],
    filters: filters
  });

  let responses = yield options.xhr.send(req, calendar.url, {
    sandbox: options.sandbox
  });

  return responses.map(res => {
    debug(`Found calendar object with url ${res.href}`);
    return new CalendarObject({
      data: res,
      calendar: calendar,
      url: url.resolve(calendar.account.rootUrl, res.href),
      etag: res.props.getetag,
      calendarData: res.props.calendarData
    });
  });
});

/**
 * @param {dav.Calendar} calendar the calendar to fetch updates to.
 * @return {Promise} promise will resolve with updated calendar object.
 *
 * Options:
 *
 *   (Array.<Object>) filters - list of caldav filters to send with request.
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (String) syncMethod - either 'basic' or 'webdav'. If unspecified, will
 *       try to do webdav sync and failover to basic sync if rfc 6578 is not
 *       supported by the server.
 *   (String) timezone - VTIMEZONE calendar object.
 *   (dav.Transport) xhr - request sender.
 */
export function syncCalendar(calendar, options) {
  options.basicSync = basicSync;
  options.webdavSync = webdavSync;
  return webdav.syncCollection(calendar, options);
}

/**
 * @param {dav.Account} account the account to fetch updates for.
 * @return {Promise} promise will resolve with updated account.
 *
 * Options:
 *
 *   (dav.Sandbox) sandbox - optional request sandbox.
 *   (dav.Transport) xhr - request sender.
 */
export let syncCaldavAccount = co.wrap(function *(account, options={}) {
  options.loadObjects = false;
  if (!account.calendars) account.calendars = [];

  let cals = yield listCalendars(account, options);
  cals
    .filter(cal => {
      // Filter the calendars not previously seen.
      return account.calendars.every(prev => !fuzzyUrlEquals(prev.url, cal.url));
    })
    .forEach(cal => {
      // Add them to the account's calendar list.
      account.calendars.push(cal);
    });

  options.loadObjects = true;
  yield account.calendars.map(co.wrap(function *(cal, index) {
    try {
      yield syncCalendar(cal, options);
    } catch (error) {
      debug(`Sync calendar ${cal.displayName} failed with ${error}`);
      account.calendars.splice(index, 1);
    }
  }));

  return account;
});

let basicSync = co.wrap(function *(calendar, options) {
  let sync = yield webdav.isCollectionDirty(calendar, options);
  if (!sync) {
    debug('Local ctag matched remote! No need to sync :).');
    return calendar;
  }

  debug('ctag changed so we need to fetch stuffs.');
  calendar.objects = yield listCalendarObjects(calendar, options);
  return calendar;
});

let webdavSync = co.wrap(function *(calendar, options) {
  var req = request.syncCollection({
    props: [
      { name: 'getetag', namespace: ns.DAV },
      { name: 'calendar-data', namespace: ns.CALDAV }
    ],
    syncLevel: 1,
    syncToken: calendar.syncToken
  });

  let result = yield options.xhr.send(req, calendar.url, {
    sandbox: options.sandbox
  });

  // TODO(gareth): Handle creations and deletions.
  result.responses.forEach(function(response) {
    // Find the calendar object that this response corresponds with.
    var calendarObject = calendar.objects.filter(function(object) {
      return fuzzyUrlEquals(object.url, response.href);
    })[0];

    if (!calendarObject) {
      return;
    }

    calendarObject.etag = response.props.getetag;
    calendarObject.calendarData = response.props.calendarData;
  });

  calendar.syncToken = result.syncToken;
  return calendar;
});
