import co from 'co';

import fuzzyUrlEquals from './fuzzy_url_equals';
import * as ns from './namespace';
import * as request from './request';

let debug = require('./debug')('dav:webdav');

/**
 * @param {String} objectUrl url for webdav object.
 * @param {String} objectData webdav object data.
 */
export function createObject(objectUrl, objectData, options) {
  // ugly (breaks calendar), but we will get rid of the lib anyway... hopefully... soon...
  var req = request.basic({ method: 'PUT', data: objectData, contentType: 'text/vcard;charset=utf-8' });
  return options.xhr.send(req, objectUrl, { sandbox: options.sandbox });
}

export function updateObject(objectUrl, objectData, etag, options) {
  // ugly (breaks calendar), but we will get rid of the lib anyway... hopefully... soon...
  var req = request.basic({ method: 'PUT', data: objectData, etag: etag, contentType: 'text/vcard;charset=utf-8' });
  return options.xhr.send(req, objectUrl, { sandbox: options.sandbox });
}

export function deleteObject(objectUrl, etag, options) {
  var req = request.basic({ method: 'DELETE', etag: etag });
  return options.xhr.send(req, objectUrl, { sandbox: options.sandbox });
}

export function syncCollection(collection, options) {
  let syncMethod;
  if ('syncMethod' in options) {
    syncMethod = options.syncMethod;
  } else if (collection.reports &&
             collection.reports.indexOf('syncCollection') !== -1) {
    syncMethod = 'webdav';
  } else {
    syncMethod = 'basic';
  }

  if (syncMethod === 'webdav') {
    debug('rfc 6578 sync.');
    return options.webdavSync(collection, options);
  } else {
    debug('basic sync.');
    return options.basicSync(collection, options);
  }
}

export function updateProperties(objectUrl, options) {
  var req = request.proppatch({
      props: options.props
  });
  return options.xhr.send(req, objectUrl, { sandbox: options.sandbox });
}

export function createCollection(collectionUrl, options) {
  var req = request.mkcol({
	  props: options.props
  });
  return options.xhr.send(req, collectionUrl, { sandbox: options.sandbox });
}

export function deleteCollection(collectionUrl, options) {
  var req = request.basic({ method: 'DELETE' });
  return options.xhr.send(req, collectionUrl, { sandbox: options.sandbox });
}

export function moveCollection(collectionUrl, options) {
  var req = request.basic({ method: 'MOVE', overwrite: 'F', destination: options.destination, data:objectData });
  return options.xhr.send(req, collectionUrl, { sandbox: options.sandbox });
}

/**
 * @param {dav.DAVCollection} collection to fetch report set for.
 */
export let supportedReportSet = co.wrap(function *(collection, options) {
  debug('Checking supported report set for collection at ' + collection.url);
  var req = request.propfind({
    props: [ { name: 'supported-report-set', namespace: ns.DAV } ],
    depth: 1,
    mergeResponses: true
  });

  let response = yield options.xhr.send(req, collection.url, {
    sandbox: options.sandbox
  });

  return response.props.supportedReportSet;
});

export let isCollectionDirty = co.wrap(function *(collection, options) {
  if (!collection.ctag) {
    debug('Missing ctag.');
    return false;
  }

  debug('Fetch remote getctag prop.');
  var req = request.propfind({
    props: [ { name: 'getctag', namespace: ns.CALENDAR_SERVER } ],
    depth: 0
  });

  let responses = yield options.xhr.send(req, collection.account.homeUrl, {
    sandbox: options.sandbox
  });

  let response = responses.filter(response => {
    // Find the response that corresponds to the parameter collection.
    return fuzzyUrlEquals(collection.url, response.href);
  })[0];

  if (!response) {
    throw new Error('Could not find collection on remote. Was it deleted?');
  }

  debug('Check whether cached ctag matches remote.');
  return collection.ctag !== response.props.getctag;
});
