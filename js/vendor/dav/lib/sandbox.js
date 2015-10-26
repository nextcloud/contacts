/**
 * @fileoverview Group requests together and then abort as a group.
 *
 * var sandbox = new dav.Sandbox();
 * return Promise.all([
 *   dav.createEvent(event, { sandbox: sandbox }),
 *   dav.deleteEvent(other, { sandbox: sandbox })
 * ])
 * .catch(function() {
 *   // Something went wrong so abort all requests.
 *   sandbox.abort;
 * });
 */
let debug = require('./debug')('dav:sandbox');

export class Sandbox {
  constructor() {
    this.requestList = [];
  }

  add(request) {
    debug('Adding request to sandbox.');
    this.requestList.push(request);
  }

  abort() {
    debug('Aborting sandboxed requests.');
    this.requestList.forEach(request => request.abort());
  }
}

export function createSandbox() {
  return new Sandbox();
}
