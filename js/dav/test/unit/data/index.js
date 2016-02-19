import fs from 'fs';
import { format } from 'util';

import camelize from '../../../lib/camelize';

let docs = {};
export default docs;

[
  'address_book_query',
  'current_user_principal',
  'calendar_query',
  'propfind',
  'propfind_oc',
  'sync_collection'
].forEach(function(responseType) {
  var camelCase = camelize(responseType);
  docs[camelCase] = fs
    .readFileSync(
      format('%s/%s.xml', __dirname, responseType),
      'utf-8'
    )
    .replace(/>\s+</g, '><');  // Remove whitespace between close and open tag.
});
