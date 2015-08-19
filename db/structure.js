var Toposort = require('toposort-class');
var fs = require('fs');
var path = require('path');
require('./');

var t = module.exports = new Toposort();

fs.readdirSync(__dirname + '/definitions').forEach(function(fileName) {
  if (path.extname(fileName) === '.js') {
    scanTable(require(__dirname + '/definitions/' + fileName));
  }
});

function scanTable(definition) {
  var schema = definition.schema;
  var dependencies = getDependencies(definition);
  t.add(definition.name, dependencies);
}

function getDependencies(definition) {
  return getColumns(definition.schema).filter(hasReference).map(getTable);

  function hasReference(column) {
    return column.references != null && column.references.table !== definition.name;
  }
}

function getTable(column) {
  return column.references.table;
}

function getColumns(schema) {
  return Object.keys(schema).map(function(key) {
    return schema[key];
  });
}
