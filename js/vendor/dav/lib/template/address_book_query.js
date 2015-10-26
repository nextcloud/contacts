import prop from './prop';

export default function addressBookQuery(object) {
  return `<card:addressbook-query xmlns:card="urn:ietf:params:xml:ns:carddav"
                          xmlns:d="DAV:">
    <d:prop>
      ${object.props.map(prop)}
    </d:prop>
    <!-- According to http://stackoverflow.com/questions/23742568/google-carddav-api-addressbook-multiget-returns-400-bad-request,
         Google's CardDAV server requires a filter element. I don't think all addressbook-query calls need a filter in the spec though? -->
    <card:filter>
      <card:prop-filter name="FN">
      </card:prop-filter>
    </card:filter>
  </card:addressbook-query>`
}
