import url from 'url';

import * as accounts from './accounts';
import * as calendars from './calendars';
import * as contacts from './contacts';

/**
 * @param {dav.Transport} xhr - request sender.
 *
 * Options:
 *
 *   (String) baseUrl - root url to resolve relative request urls with.
 */
export class Client {
  constructor(xhr, options={}) {
    this.xhr = xhr;
    Object.assign(this, options);

    // Expose internal modules for unit testing
    this._accounts = accounts;
    this._calendars = calendars;
    this._contacts = contacts;
  }

  /**
   * @param {dav.Request} req - dav request.
   * @param {String} uri - where to send request.
   * @return {Promise} a promise that will be resolved with an xhr request
   *     after its readyState is 4 or the result of applying an optional
   *     request `transformResponse` function to the xhr object after its
   *     readyState is 4.
   *
   * Options:
   *
   *   (Object) sandbox - optional request sandbox.
   */
  send(req, uri, options) {
    if (this.baseUrl) {
      let urlObj = url.parse(uri);
      uri = url.resolve(this.baseUrl, urlObj.path);
    }

    return this.xhr.send(req, uri, options);
  }

  createAccount(options={}) {
    options.xhr = options.xhr || this.xhr;
    return accounts.createAccount(options);
  }

  createCalendarObject(calendar, options={}) {
    options.xhr = options.xhr || this.xhr;
    return calendars.createCalendarObject(calendar, options);
  }

  updateCalendarObject(calendarObject, options={}) {
    options.xhr = options.xhr || this.xhr;
    return calendars.updateCalendarObject(calendarObject, options);
  }

  deleteCalendarObject(calendarObject, options={}) {
    options.xhr = options.xhr || this.xhr;
    return calendars.deleteCalendarObject(calendarObject, options);
  }

  syncCalendar(calendar, options={}) {
    options.xhr = options.xhr || this.xhr;
    return calendars.syncCalendar(calendar, options);
  }

  syncCaldavAccount(account, options={}) {
    options.xhr = options.xhr || this.xhr;
    return calendars.syncCaldavAccount(account, options);
  }

  createCard(addressBook, options={}) {
    options.xhr = options.xhr || this.xhr;
    return contacts.createCard(addressBook, options);
  }

  updateCard(card, options={}) {
    options.xhr = options.xhr || this.xhr;
    return contacts.updateCard(card, options);
  }

  deleteCard(card, options={}) {
    options.xhr = options.xhr || this.xhr;
    return contacts.deleteCard(card, options);
  }

  syncAddressBook(addressBook, options={}) {
    options.xhr = options.xhr || this.xhr;
    return contacts.syncAddressBook(addressBook, options);
  }

  syncCarddavAccount(account, options={}) {
    options.xhr = options.xhr || this.xhr;
    return contacts.syncCarddavAccount(account, options);
  }
}
