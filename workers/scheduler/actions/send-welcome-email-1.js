var moment    = require('moment-timezone');
var config    = require('../../../config');
var logger    = require('../../../logger').scheduler;
var welcomer  = require('../../../lib/welcome-emailer');

module.exports = function( job, done ){
  welcomer.send( job.data.id, done );
};
