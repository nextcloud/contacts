import camelize from '../../../lib/camelize';
import { format } from 'util';
import fs from 'fs';

let docs = {};
export default docs;

[
  { name: 'bastille_day_party', fmt: 'ics' },
  { name: 'forrest_gump', fmt: 'vcf' }
].forEach(function(file) {
  let camelCase = camelize(file.name);
  docs[camelCase] = fs.readFileSync(
    format('%s/%s.%s', __dirname, file.name, file.fmt),
    'utf-8'
  );
});
