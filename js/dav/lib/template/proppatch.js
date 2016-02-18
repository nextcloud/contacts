import prop from './prop';

export default function proppatch(object) {
  return `<d:propertyupdate xmlns:c="urn:ietf:params:xml:ns:caldav"
              xmlns:card="urn:ietf:params:xml:ns:carddav"
              xmlns:cs="http://calendarserver.org/ns/"
              xmlns:d="DAV:">
    <d:set>
      <d:prop>
        ${object.props.map(prop)}
      </d:prop>
    </d:set>
  </d:propertyupdate>`;
}
