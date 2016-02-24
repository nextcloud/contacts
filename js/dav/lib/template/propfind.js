import prop from './prop';

export default function propfind(object) {
  return `<d:propfind xmlns:c="urn:ietf:params:xml:ns:caldav"
              xmlns:card="urn:ietf:params:xml:ns:carddav"
              xmlns:cs="http://calendarserver.org/ns/"
              xmlns:oc="http://owncloud.org/ns"
              xmlns:d="DAV:">
    <d:prop>
      ${object.props.map(prop)}
    </d:prop>
  </d:propfind>`;
}
