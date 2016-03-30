var db = require('../../db');
var logger = require('./logger');

/**
 * Schedules a new job
 *
 * @param {string}   action
 * @param {Date}     datetime to run job by
 * @param {object}   data for consumers
 * @param {function} callback(err, result)
 */

module.exports = function enqueue(action, datetime, data, predicateId, callback) {
  if ( typeof action !== 'string') {
    callback && callback('Invalid action type: ' + typeof action);
  }

  if ( typeof predicateId === 'function' ){
    callback = predicateId;
    predicateId = null;
  }

  var query = {
    type: 'insert'
  , table: 'scheduled_jobs'
  , values: {
      action: action
    , data: data
    , status: 'pending'
    , datetime: datetime
    }
  , returning: ['*']
  };

  logger.info('Enqueue', {
    action:   action
  , data:     data
  , datetime: datetime
  });

  db.query2(query, function(error, result){
    if (error) {
      logger.error('Error running enqueue query', error);
    }
    callback && callback(error, Array.isArray(result) ? result[0] : null);
  }.bind(this));
  return this;
};
