import camelize from './camelize';

let debug = require('./debug')('dav:parser');

let DOMParser;
if (typeof self !== 'undefined' && 'DOMParser' in self) {
  // browser main thread
  DOMParser = self.DOMParser;
} else {
  // nodejs or web worker
  DOMParser = require('xmldom').DOMParser;
}

export function multistatus(string) {
  let parser = new DOMParser();
  let doc = parser.parseFromString(string, 'text/xml');
  let result = traverse.multistatus(child(doc, 'multistatus'));
  debug(`input:\n${string}\noutput:\n${JSON.stringify(result)}\n`);
  return result;
}

let traverse = {
  // { response: [x, y, z] }
  multistatus: node => complex(node, { response: true }),

  // { propstat: [x, y, z] }
  response: node => complex(node, { propstat: true, href: false }),

  // { prop: x }
  propstat: node => complex(node, { prop: false }),

  // {
  //   resourcetype: x
  //   supportedCalendarComponentSet: y,
  //   supportedReportSet: z
  // }
  prop: node => {
    return complex(node, {
      resourcetype: false,
      supportedCalendarComponentSet: false,
      supportedReportSet: false,
      currentUserPrincipal: false
    });
  },

  resourcetype: node => {
    return childNodes(node).map(childNode => childNode.localName);
  },

  // [x, y, z]
  supportedCalendarComponentSet: node => complex(node, { comp: true }, 'comp'),

  // [x, y, z]
  supportedReportSet: node => {
    return complex(node, { supportedReport: true }, 'supportedReport');
  },

  comp: node => node.getAttribute('name'),

  // x
  supportedReport: node => complex(node, { report: false }, 'report'),

  report: node => {
    return childNodes(node).map(childNode => childNode.localName);
  },

  href: node => {
    return decodeURIComponent(childNodes(node)[0].nodeValue);
  },

  currentUserPrincipal: node => {
    return complex(node, {href: false}, 'href');
  }
};

function complex(node, childspec, collapse) {
  let result = {};
  for (let key in childspec) {
    if (childspec[key]) {
      // Create array since we're expecting multiple.
      result[key] = [];
    }
  }

  childNodes(node).forEach(
    childNode => traverseChild(node, childNode, childspec, result)
  );

  return maybeCollapse(result, childspec, collapse);
}

/**
 * Parse child childNode of node with childspec and write outcome to result.
 */
function traverseChild(node, childNode, childspec, result) {
  if (childNode.nodeType === 3 && /^\s+$/.test(childNode.nodeValue)) {
    // Whitespace... nothing to do.
    return;
  }

  let localName = camelize(childNode.localName, '-');
  if (!(localName in childspec)) {
    debug('Unexpected node of type ' + localName + ' encountered while ' +
          'parsing ' + node.localName + ' node!');
    let value = childNode.textContent;
    if (localName in result) {
      if (!Array.isArray(result[camelCase])) {
        // Since we've already encountered this node type and we haven't yet
        // made an array for it, make an array now.
        result[localName] = [result[localName]];
      }

      result[localName].push(value);
      return;
    }

    // First time we're encountering this node.
    result[localName] = value;
    return;
  }

  let traversal = traverse[localName](childNode);
  if (childspec[localName]) {
    // Expect multiple.
    result[localName].push(traversal);
  } else {
    // Expect single.
    result[localName] = traversal;
  }
}

function maybeCollapse(result, childspec, collapse) {
  if (!collapse) {
    return result;
  }

  if (!childspec[collapse]) {
    return result[collapse];
  }

  // Collapse array.
  return result[collapse].reduce((a, b) => a.concat(b), []);
}

function childNodes(node) {
  let result = node.childNodes;
  if (!Array.isArray(result)) {
    result = Array.prototype.slice.call(result);
  }

  return result;
}

function children(node, localName) {
  return childNodes(node).filter(childNode => childNode.localName === localName);
}

function child(node, localName) {
  return children(node, localName)[0];
}
