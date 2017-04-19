import prop from './prop';

function href(href) {
  return `<d:href>${href}</d:href>`;
}

export default function addressBookMultiget(object) {
  return `<card:addressbook-multiget xmlns:card="urn:ietf:params:xml:ns:carddav"
                          xmlns:d="DAV:">
    <d:prop>
      ${object.props.map(prop).join("")}
    </d:prop>
    ${object.hrefs.map(href).join("")}
  </card:addressbook-multiget>`;
}
