var domain = require('domain');

var Worker = {
  /**
   * Do the same job forever unless there is an error
   * @param  {number}   concurrency   concurrency, defaults to 1
   * @param  {Function} job           the work to do, takes in a callback
   * @param  {Function} callback      (optional) the callback is passed an error object
   */
  forever: function (concurrency, job, callback) {
    if (typeof concurrency === 'function') {
      job = concurrency;
      concurrency = 1;
    };

    // callback that will automatically restart, unless there is an error
    var cb = function (error) {
      if (callback) {
        process.nextTick(function(){
          callback(error);
        });
      }
      if(!error) job(cb);
    };

    for (var i=0; i<concurrency; i++) {
      var d = domain.create();
      d.on('error', function (error) {
        callback(error);
        job(cb); // restart
      });
      d.run(function () {
        job(cb);
      });
    };
  }
};

module.exports = Worker;