var Scheduler = function() {
  this.actions = [];
};

Scheduler.prototype.schedule = function(action, data, callback) {
  if ( typeof action !== 'string') {
    callback && callback('Invalid action type: ' + typeof action);
  }



};

Scheduler.prototype.run = function(action) {

};

module.exports = new Scheduler();
