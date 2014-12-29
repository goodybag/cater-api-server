/**
 * User and Session
 * * WARNING:
 *   We use session.user.id to identify the user. You should
 *   only _ever_ set user.id when you are absolutely positive
 *   that that is the user you're dealing with. This is pretty
 *   much when the provide a valid username/password combo.
 */

var session = require('express-session');
var db      = require('../../db');
var utils   = require('../../utils');
var Store   = require('./store')( session );

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    queryOptions: {
      one: [{ table: 'users', alias: 'user' }]
    }
  , dal: require('./dal')
  });

  if ( !options.secret ){
    throw new Error('Missing required property `secret`');
  }

  if ( !options.cookie ){
    throw new Error('Missing required property `cookie`');
  }

  db.dirac.register( options.dal );

  // Dal was registered before db module got a hold of it
  // so expose it once dirac has instantiated it
  db.dirac.use( function(){
    var dal = db[ options.dal.name ] = db.dirac.dals[ options.dal.name ];

    // Create the table
    dal.createIfNotExists( function( error ){
      if ( error ) throw error;
      console.log('Dal creation success!');
    });
  });

  var dSession = session({
    store:  new Store({
              dal:          options.dal
            , queryOptions: options.queryOptions
            })
  , secret: options.secret
  , cookie: options.cookie
  , resave: options.resave
  , saveUnitialized: options.saveUnitialized
  });

  var cParser = require('cookie-parser')( options.secret );

  return function( req, res, next ){
    utils.async.series([
      cParser.bind( null, req, res )
    , dSession.bind( null, req, res )
    ], function( error ){
      if ( error ) return next( error );

      next();
    });
  };
};
