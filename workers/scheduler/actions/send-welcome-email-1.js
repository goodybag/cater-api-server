var moment    = require('moment-timezone');
var config    = require('../../../config');
var logger    = require('../../../logger').scheduler;
var welcomer  = require('../../../lib/welcome-emailer');

module.exports = function( user, done ){
  welcomer.send( user.id, done );
};
