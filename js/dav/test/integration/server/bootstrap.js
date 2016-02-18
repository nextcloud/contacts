import { format } from 'util';
import { exec, spawn } from 'child_process';
import tcpPortUsed from 'tcp-port-used';

let debug = require('../../../lib/debug')('dav:test:bootstrap');

let calendarData = {
  table: 'calendars',
  data: {
    principaluri: 'principals/admin',
    displayname: 'default calendar',
    uri: 'default',
    description: 'administrator calendar',
    components: 'VEVENT,VTODO',
    transparent: '0',
    synctoken: '1'
  }
};

let contactsData = {
  table: 'addressbooks',
  data: {
    principaluri: 'principals/admin',
    displayname: 'default address book',
    uri: 'default',
    description: 'administrator address book',
    synctoken: '1'
  }
};


let inserts = [calendarData, contactsData].map(tableData => {
  let table = tableData.table,
      data = tableData.data;

  let columns = [],
      values = [];
  for (let column in data) {
    let value = data[column];
    columns.push(column);
    values.push(`\'${value}\'`);
  }

  return format(
    'echo "INSERT INTO %s (%s) VALUES (%s);" | sqlite3 data/db.sqlite',
    table,
    columns.join(','),
    values.join(',')
  );
});

[
  'rm -rf data/',
  'mkdir data/',
  'chmod -R a+rw data/',
  'cat examples/sql/sqlite.* | sqlite3 data/db.sqlite'
].concat(inserts).forEach(command => {
  debug(`exec: ${command}`);
  setup(function(done) {
    exec(command, { cwd: __dirname + '/SabreDAV' }, () => done());
  });
});

let server;
setup(function() {
  debug('Start dav server.');
  server = spawn('php', [
    '-S',
    '127.0.0.1:8888',
    'calendarserver.php'
  ], {
    cwd: __dirname + '/SabreDAV'
  });

  server.stdout.on('data', function(chunk) {
    debug(chunk.toString());
  });

  server.stderr.on('data', function(chunk) {
    debug(chunk.toString());
  });

  debug('Wait for dav server to start.');
  return tcpPortUsed.waitUntilUsed(8888, 100, 20000);
});

teardown(function() {
  debug('Wait for server to die.');
  return new Promise(function(resolve) {
    server.on('exit', function() {
      debug('Server died.');
      resolve();
    });

    server.kill();
  });
});

[
  'rm -rf data/'
].forEach(function(command) {
  teardown(function(done) {
    exec(command, { cwd: __dirname }, () => done());
  });
});
