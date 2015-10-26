import prop from './prop';

export default function syncCollection(object) {
  return `<d:sync-collection xmlns:c="urn:ietf:params:xml:ns:caldav"
                     xmlns:card="urn:ietf:params:xml:ns:carddav"
                     xmlns:d="DAV:">
    <d:sync-level>${object.syncLevel}</d:sync-level>
    <d:sync-token>${object.syncToken}</d:sync-token>
    <d:prop>
      ${object.props.map(prop)}
    </d:prop>
  </d:sync-collection>`
}
