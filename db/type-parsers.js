/**
 * Configures custom pg type parsers. Returns hash of data types and their
 * parsing functions.
 * 
 * If you wanted you could convert all timestamps into moment
 * objects. But that might not be a good idea.
 *
 * OIDs can be found by
 * select oid, typname from pg_type where typtype = 'b' order by oid;
 */

var pg = require('pg');
var types = pg.types;

var parsers = module.exports = {
  timestamp: {
    oid: 1114
  , fn: function(val) {
      return val;
    }
  }
};

var setTypeParser = function(type) {
  var parser = parsers[type];
  types.setTypeParser(parser.oid, parser.fn);
};

Object.keys(parsers).forEach(setTypeParser);
