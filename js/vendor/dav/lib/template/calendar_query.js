import filter from './filter';
import prop from './prop';

export default function calendarQuery(object) {
  return `<c:calendar-query xmlns:c="urn:ietf:params:xml:ns:caldav"
                    xmlns:cs="http://calendarserver.org/ns/"
                    xmlns:d="DAV:">
    <d:prop>
      ${object.props.map(prop)}
    </d:prop>
    <c:filter>
      ${object.filters.map(filter)}
    </c:filter>
    ${object.timezone ? '<c:timezone>' + object.timezone + '</c:timezone>' : ''}
  </c:calendar-query>`;
}
