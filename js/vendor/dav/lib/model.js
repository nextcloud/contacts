export class Account {
  constructor(options) {
    Object.assign(this, {
      server: null,
      credentials: null,
      rootUrl: null,
      principalUrl: null,
      homeUrl: null,
      calendars: null,
      addressBooks: null
    }, options);
  }
}

/**
 * Options:
 *   (String) username - username (perhaps email) for calendar user.
 *   (String) password - plaintext password for calendar user.
 *   (String) clientId - oauth client id.
 *   (String) clientSecret - oauth client secret.
 *   (String) authorizationCode - oauth code.
 *   (String) redirectUrl - oauth redirect url.
 *   (String) tokenUrl - oauth token url.
 *   (String) accessToken - oauth access token.
 *   (String) refreshToken - oauth refresh token.
 *   (Number) expiration - unix time for access token expiration.
 */
export class Credentials {
  constructor(options) {
    Object.assign(this, {
      username: null,
      password: null,
      clientId: null,
      clientSecret: null,
      authorizationCode: null,
      redirectUrl: null,
      tokenUrl: null,
      accessToken: null,
      refreshToken: null,
      expiration: null
    }, options);
  }
}

export class DAVCollection {
  constructor(options) {
    Object.assign(this, {
      data: null,
      objects: null,
      account: null,
      ctag: null,
      description: null,
      displayName: null,
      reports: null,
      resourcetype: null,
      syncToken: null,
      url: null
    }, options);
  }
}

export class AddressBook extends DAVCollection {
  constructor(options) {
    super(options);
  }
}

export class Calendar extends DAVCollection {
  constructor(options) {
    super(options);
    Object.assign(this, {
      components: null,
      timezone: null
    }, options);
  }
}

export class DAVObject {
  constructor(options) {
    Object.assign(this, {
      data: null,
      etag: null,
      url: null
    }, options);
  }
}

export class CalendarObject extends DAVObject {
  constructor(options) {
    super(options);
    Object.assign(this, {
      calendar: null,
      calendarData: null
    }, options);
  }
}

export class VCard extends DAVObject {
  constructor(options) {
    super(options);
    Object.assign(this, {
      addressBook: null,
      addressData: null
    }, options);
  }
}
