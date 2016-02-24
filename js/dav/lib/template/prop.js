import * as ns from '../namespace';

/**
 * @param {Object} filter looks like
 *
 *     {
 *       type: 'comp-filter',
 *       attrs: {
 *         name: 'VCALENDAR'
 *       }
 *     }
 *
 * Or maybe
 *
 *     {
 *       type: 'time-range',
 *       attrs: {
 *         start: '20060104T000000Z',
 *         end: '20060105T000000Z'
 *       }
 *     }
 *
 * You can nest them like so:
 *
 *     {
 *       type: 'comp-filter',
 *       attrs: { name: 'VCALENDAR' },
 *       children: [{
 *         type: 'comp-filter',
 *         attrs: { name: 'VEVENT' },
 *         children: [{
 *           type: 'time-range',
 *           attrs: { start: '20060104T000000Z', end: '20060105T000000Z' }
 *         }]
 *       }]
 *     }
 */
export default function prop(item) {
  if (!item.children || !item.children.length) {
    if (typeof item.value === "undefined") {
      return `<${xmlnsPrefix(item.namespace)}:${item.name} />`;
    }
    return `<${xmlnsPrefix(item.namespace)}:${item.name}>${item.value}</${xmlnsPrefix(item.namespace)}:${item.name}>`;
  }

  let children = item.children.map(prop);
  return `<${xmlnsPrefix(item.namespace)}:${item.name}>
            ${children}
          </${xmlnsPrefix(item.namespace)}:${item.name}>`;
}

function xmlnsPrefix(namespace) {
  switch (namespace) {
    case ns.DAV:
      return 'd';
    case ns.CALENDAR_SERVER:
      return 'cs';
    case ns.CALDAV:
      return 'c';
    case ns.CARDDAV:
      return 'card';
    case ns.OC:
      return 'oc';
    default:
      throw new Error('Unrecognized xmlns ' + namespace);
  }
}
