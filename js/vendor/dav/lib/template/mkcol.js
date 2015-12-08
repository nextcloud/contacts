import prop from './prop';

export default function mkcol(object) {
  return `<d:mkcol xmlns:c="urn:ietf:params:xml:ns:caldav"
              xmlns:card="urn:ietf:params:xml:ns:carddav"
              xmlns:cs="http://calendarserver.org/ns/"
              xmlns:d="DAV:">
    <d:set>
      <d:prop>
      	<d:resourcetype>
      	  <d:collection/>
          <card:addressbook/>
      	</d:resourcetype>
        ${object.props.map(prop)}
      </d:prop>
    </d:set>
  </d:mkcol>`;
}
