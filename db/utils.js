/**
 * Setup database
 *
 * Will connect to the postgres database specified in config and
 * drop all tables specified in config.schemaFiles, and then will
 * re-create them using the schema in the file.
 *
 * NOTE: this assumes that the filename for the schema
 * corresponds to the actual collection name in the database.
 */

var
  fs          = require('fs')
  , pg        = require('pg')
  , when      = require('when')
  , pipeline  = require('when/pipeline')
  , config    = require('../config')
  , db        = require('./index')

  , client   = null
  , verbose  = false
  ;

function loadFile(log, file) {
  return function() {
    if (verbose) { console.log(log); }
    var sql = when.defer();
    fs.readFile(file, 'utf-8', function(error, data){
      if (error) {
        console.log('Error loading', file, error);
        sql.reject(error);
      } else {
        sql.resolve(data);
      }
    });
    return sql.promise;
  };
}

function createTable(definition, callback) {
  var sql = [];
  var schema = definition.schema;

  // assemble the CREATE TABLE command from the schema structure
  for (var field in schema) {
    var parts = ['"'+field+'"', schema[field].type];

    if (schema[field].pk === true) parts.push('PRIMARY KEY');
    if (schema[field].nullable === false) parts.push('NOT NULL');
    if (schema[field].unique === true) parts.push('UNIQUE');
    if (schema[field].default != null) parts.push('DEFAULT ' + schema[field].default);
    if (schema[field].checks != null) {
      var checks = [];
      for (var i=0, l=schema[field].checks.length; i<l; i++)
        checks.push('CHECK (' + field + ' ' + schema[field].checks[i] + ')');
      parts.push(checks.join(', '));
    }

    if (schema[field].references && schema[field].references.table && schema[field].references.column)
      parts.push(['REFERENCES', schema[field].references.table, '("' + schema[field].references.column + '")'].join(' '));

    sql.push(parts.join(' '));
  }
  var statement = 'CREATE TABLE IF NOT EXISTS "'+definition.name+'" ( '+sql.join(', ')+' );';
  // console.log(statement);
  db.query(statement, callback);
}

function buildDropIndexSql(log, schemaFile) {
  return function() {
    if (verbose) { console.log(log); }
    var sql = [];
    var definition = require(__dirname + '/definitions/' + name);
    var indices = definition.indices;

    // assemble the DROP INDEX command from the schema structure
    for (var name in indices) {
      sql.push('DROP INDEX IF EXISTS '+name+';');
    }
    return sql.join(' ');
  };
}

function buildCreateIndexSql(log, schemaFile) {
  return function() {
    if (verbose) { console.log(log); }
    var sql = [];
    var definition = require(__dirname + '/definitions/' + name);
    var indices = definition.indices;

    // assemble the CREATE INDEX command from the schema structure
    for (var name in indices) {
      var index = indices[name];
      sql.push([
        'CREATE', (index.type) ? index.type : '', 'INDEX', '"'+name+'"', 'ON', '"'+definition.name+'"',
          (index.using) ? 'USING '+index.using : '',
          '(', index.columns.join(','), ')'
      ].join(' '));
    }
    return sql.join('; ');
  };
}

function query(log, sql) {
  return function(paramSql) {
    // not given a query to run?
    if (!sql) { sql = paramSql; } // run query returned by last item in the pipeline
    if (!log) { log = sql; }
    if (verbose) { console.log(log); }
    var query = client.query(sql);
    var deferred = when.defer();
    query.on('error', function(e) { console.log(e); });
    query.on('end', deferred.resolve);
    return deferred.promise;
  };
}

function loadTableSchema(name) {
  return pipeline([
    query( 'Dropping Sequence for ' + name, 'drop sequence if exists "' + name + '_id_seq" cascade'),
    query( 'Dropping ' + name,              'drop table if exists "' + name + '" cascade'),
    buildCreateTableSql('Creating ' + name, name),
    query() // will run what getSql returns
  ]);
}

function loadIndexSchema() {
  return pipeline([
    buildDropIndexSql('Dropping old indices', 'indices'),
    query(),
    buildCreateIndexSql('Creating new indices', 'indices'),
    query()
  ]);
}

function loadSqlFile(name, path, message) {
  return function() {
    if (!name) { return; }
    return pipeline([
      loadFile(message, path+name+'.sql'),
      query()
    ]);
  };
}

module.exports.createTable = createTable;
