/**
 * Store User Agent
 */

var utils = require('../utils');
var db    = require('../db');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    age: 1000*60//*60 // Update UA each hour a request comes in
  });

  var end = {};

  return function( req, res, next ){
    next();

    var uid = req.user.attributes.id;

    if ( end[ uid ] && Date.now() < end[ uid ] ) return;

    var logger  = req.logger.create('Middleware-StoreUserAgent');
    var $update = { user_agent: req.header('User-Agent' ) };

    logger.info( 'Updating user', uid, { user_agent: $update.user_agent } );
    db.users.update( uid, $update, function( error ){
      if ( error ){
        logger.error( 'Could not update user_agent for user', uid, {
          error: error
        });
      } else {
        end[ uid ] = Date.now() + options.age;
      }
    });
  };
};