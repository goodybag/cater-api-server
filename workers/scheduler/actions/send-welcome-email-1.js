var moment    = require('moment-timezone');
var config    = require('../../../config');
var slogger   = require('../logger');
var welcomer  = require('../../../lib/welcome-emailer');

module.exports = function( job, done ){
  var logger = slogger.create('Send Welcome Email', {
    data: job
  });

  logger.info('Sending welcome email');

  welcomer.send( job.data.id, done );
};
