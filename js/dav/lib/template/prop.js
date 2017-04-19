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
	var tagName = `${xmlnsPrefix(item.namespace)}:${item.name}`;
	var attrs = (item.attrs || []).map(makeAttr).join(' ');
  if (!item.children || !item.children.length) {
    if (typeof item.value === "undefined") {
      return `<${tagName} ${attrs}/>`;
    }
    return `<${tagName} ${attrs}>${item.value}</${tagName}>`;
  }

  let children = item.children.map(prop);
  return `<${tagName} ${attrs}>
            ${children.join('')}
          </${tagName}>`;
}

function makeAttr(attr) {
  if (!attr.name) return '';
	if (!attr.value) return attr.name;
	return `${attr.name}="${attr.value}"`;
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
