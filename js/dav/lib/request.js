import { multistatus } from './parser';
import * as template from './template';

/**
 * Options:
 *
 *   (String) depth - optional value for Depth header.
 *   (Array.<Object>) props - list of props to request.
 */
export function addressBookQuery(options) {
  return collectionQuery(
    template.addressBookQuery({ props: options.props || [] }),
    { depth: options.depth }
  );
}

export function addressBookMultiget(options) {
  return collectionQuery(
    template.addressBookMultiget({ props: options.props || [], hrefs: options.hrefs || [] }),
    { depth: options.depth }
  );
}

/**
 * Options:
 *
 *   (String) data - put request body.
 *   (String) method - http method.
 *   (String) etag - cached calendar object etag.
 */
export function basic(options) {
  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  return new Request({
    method: options.method,
    requestData: options.data,
    transformRequest: transformRequest
  });
}

/**
 * Options:
 *
 *   (String) depth - optional value for Depth header.
 *   (Array.<Object>) filters - list of filters to send with request.
 *   (Array.<Object>) props - list of props to request.
 *   (String) timezone - VTIMEZONE calendar object.
 */
export function calendarQuery(options) {
  return collectionQuery(
    template.calendarQuery({
      props: options.props || [],
      filters: options.filters || [],
      timezone: options.timezone
    }),
    {
      depth: options.depth
    }
  );
}

export function collectionQuery(requestData, options) {
  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  function transformResponse(xhr) {
    return multistatus(xhr.responseText).response.map(res => {
      return { href: res.href, props: getProps(res.propstat) };
    });
  }

  return new Request({
    method: 'REPORT',
    requestData: requestData,
    transformRequest: transformRequest,
    transformResponse: transformResponse
  });
}

export function mkcol(options) {
  let requestData = template.mkcol({ props: options.props });

  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  return new Request({
    method: 'MKCOL',
    requestData: requestData,
    transformRequest: transformRequest
  });
}

export function proppatch(options) {
  let requestData = template.proppatch({ props: options.props });

  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  return new Request({
    method: 'PROPPATCH',
    requestData: requestData,
    transformRequest: transformRequest
  });
}

/**
 * Options:
 *
 *   (String) depth - optional value for Depth header.
 *   (Array.<Object>) props - list of props to request.
 */
export function propfind(options) {
  let requestData = template.propfind({ props: options.props });

  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  function transformResponse(xhr) {
    let responses = multistatus(xhr.responseText).response.map(res => {
      return { href: res.href, props: getProps(res.propstat) };
    });

    if (!options.mergeResponses) {
      return responses;
    }

    // Merge the props.
    let merged = mergeProps(responses.map(res => res.props));
    let hrefs = responses.map(res => res.href);
    return { props: merged, hrefs: hrefs };
  }

  return new Request({
    method: 'PROPFIND',
    requestData: requestData,
    transformRequest: transformRequest,
    transformResponse: transformResponse
  });
}

/**
 * Options:
 *
 *   (String) depth - option value for Depth header.
 *   (Array.<Object>) props - list of props to request.
 *   (Number) syncLevel - indicates scope of the sync report request.
 *   (String) syncToken - synchronization token provided by the server.
 */
export function syncCollection(options) {
  let requestData = template.syncCollection({
    props: options.props,
    syncLevel: options.syncLevel,
    syncToken: options.syncToken
  });

  function transformRequest(xhr) {
    setRequestHeaders(xhr, options);
  }

  function transformResponse(xhr) {
    let object = multistatus(xhr.responseText);
    let responses = object.response.map(res => {
      return { href: res.href, props: getProps(res.propstat) };
    });

    return { responses: responses, syncToken: object.syncToken };
  }

  return new Request({
    method: 'REPORT',
    requestData: requestData,
    transformRequest: transformRequest,
    transformResponse: transformResponse
  });
}

export class Request {
  constructor(options={}) {
    Object.assign(this, {
      method: null,
      requestData: null,
      transformRequest: null,
      transformResponse: null,
      onerror: null
    }, options);
  }
}

function getProp(propstat) {
  if (/404/g.test(propstat.status)) {
    return null;
  }
  if (/5\d{2}/g.test(propstat.status) ||
      /4\d{2}/g.test(propstat.status)) {
    throw new Error('Bad status on propstat: ' + propstat.status);
  }

  return ('prop' in propstat) ? propstat.prop : null;
}

export function mergeProps(props) {
  return props.reduce((a, b) => Object.assign(a, b), {});
}

/**
 * Map propstats to props.
 */
export function getProps(propstats) {
  return mergeProps(
    propstats
      .map(getProp)
      .filter(prop => prop && typeof prop === 'object')
  );
}

export function setRequestHeaders(request, options) {
  request.setRequestHeader('Content-Type', 'application/xml;charset=utf-8');

  if ('depth' in options) {
    request.setRequestHeader('Depth', options.depth);
  }

  if ('etag' in options) {
    request.setRequestHeader('If-Match', options.etag);
  }

  if ('destination' in options) {
    request.setRequestHeader('Destination', options.destination);
  }

  if ('overwrite' in options) {
    request.setRequestHeader('Overwrite', options.overwrite);
  }
}
