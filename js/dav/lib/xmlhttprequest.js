let debug = require('./debug')('dav:xmlhttprequest');

let Native;
if (typeof self !== 'undefined' && 'XMLHttpRequest' in self) {
  Native = self.XMLHttpRequest;
} else {
  // Trick browserify into not loading XMLHttpRequest polyfill
  // since it is available in the platform (including web workers)
  Native = require(false || 'xmlhttprequest').XMLHttpRequest;
}

/**
 * @fileoverview Promise wrapper around native xhr api.
 */
export default class XMLHttpRequest {
  constructor(options) {
    this.request = new Native(options);
    this.sandbox = null;

    /* readwrite */
    [
      'response',
      'responseText',
      'responseType',
      'responseXML',
      'timeout',
      'upload',
      'withCredentials'
    ].forEach(attribute => {
      Object.defineProperty(this, attribute, {
        get: function() { return this.request[attribute]; },
        set: function(value) { this.request[attribute] = value; }
      });
    });

    /* readonly */
    [
      'status',
      'statusText'
    ].forEach(attribute => {
      Object.defineProperty(this, attribute, {
        get: function() { return this.request[attribute]; }
      });
    });
  }

  abort() {
    return this._callNative('abort', arguments);
  }

  getAllResponseHeaders() {
    return this._callNative('getAllResponseHeaders', arguments);
  }

  getResponseHeader() {
    return this._callNative('getResponseHeader', arguments);
  }

  open() {
    return this._callNative('open', arguments);
  }

  overrideMimeType() {
    return this._callNative('overrideMimeType', arguments);
  }

  setRequestHeader() {
    return this._callNative('setRequestHeader', arguments);
  }

  send(data) {
    debug(`Sending request data: ${data}`);
    if (this.sandbox) this.sandbox.add(this);
    let request = this.request;
    request.send(data);
    return new Promise(function(resolve, reject) {
      request.onreadystatechange = function() {
        if (request.readyState !== 4 /* done */) {
          return;
        }

        if (request.status < 200 || request.status >= 400) {
          return reject(new Error(`Bad status: ${request.status}`));
        }

        return resolve(request.responseText);
      };

      request.ontimeout = function() {
        reject(new Error(`Request timed out after ${request.timeout} ms`));
      };
    });
  }

  _callNative(method, args) {
    return this.request[method].apply(this.request, args);
  }
}
