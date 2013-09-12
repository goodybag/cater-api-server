var
  async     = require('async')
, utils     = require('./utils')
, config    = require('../config')
, db        = require('./')
;

module.exports.run = function( callback ){
  console.log("");
  console.log("######################################");
  console.log("#  Running destroy/create database  #");
  console.log("#  -------------------------------  #");
  console.log("#  ENSURE NO CLIENTS ARE CONNECTED  #");
  console.log("######################################");
  console.log("");

  var name = config.postgresConnStr.substring( config.postgresConnStr.lastIndexOf( '/' ) + 1 );

  // Temporarily connect to db postgres
  db.query.connectionParameters = config.postgresConnStr.replace( '/' + name, '/postgres');

  db.query( 'drop database if exists "' + name + '"' , function( error ){
    if ( error ) return callback( error );

    db.query( 'create database "' + name + '"', callback );

    // Reset connStr
    db.query.connectionParameters = config.postgresConnStr;
  });
};
