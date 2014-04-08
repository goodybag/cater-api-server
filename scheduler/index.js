var db = require('../db');

var Scheduler = function() {
  this.actions = [];
};

Scheduler.prototype.schedule = function(action, data, callback) {
  if ( typeof action !== 'string') {
    callback && callback('Invalid action type: ' + typeof action);
  }

  var query = {
    type: 'insert'
  , table: 'scheduled_jobs'
  , values: {
      action: action
    , data: data
    , status: 'pending'
    }
  };
  db.query2(query, function(error){
    callback && callback(error);
  });
};

Scheduler.prototype.work = function(action, consume) {
  // fetch actions not pending
  var query = {
    type: 'select'
  , table: 'scheduled_jobs'
  , where: {
      action: action
    , status: 'pending'
    }
  };

  db.query2(query, function(error, results){
    console.log(results);
  });
  // consume each row in parallel
  // mark each job success or error
};

module.exports = new Scheduler();
