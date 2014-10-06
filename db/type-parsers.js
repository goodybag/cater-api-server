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

var parsers = module.exports = [
  {
    type: 'timestamp'
  , oid: 1114
  , fn: function(val) {
      return val;
    }
  }

  // Fix PG date parsing (`date` type not to be confused with something with a timezone)
, {
    oid: 1082
  , fn: function( val ){
      return new Date( val + ' 00:00:00' );
    }
  }
];

var setTypeParser = function(parser) {
  types.setTypeParser(parser.oid, parser.fn);
};

parsers.forEach(setTypeParser);
