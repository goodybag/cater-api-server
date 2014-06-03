var db        = require('../db');
var queries   = require('../db/queries')
var utils     = require('../utils');
var errors    = require('../errors')

module.exports = function( email, password, callback ){
  if (typeof password !== 'string') return callback( errors.auth.INVALID_PASSWORD );

  var query = queries.user.get({
    email: { $custom: [ 'lower(email) = lower($1)', email ] }
  });
  var sql = db.builder.sql( query );

  db.query( sql.query, sql.values, function( error, results ){
    if ( error ) return callback( error );
    if ( results.length === 0 ) return callback( errors.auth.INVALID_EMAIL );

    var user = results[0];

    utils.comparePasswords( password, user.password, function( error, success ){
      if ( !success ) return callback( errors.auth.INVALID_EMAIL );

      return callback( null, user );
    });
  });
};