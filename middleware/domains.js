var forky = require('forky');
var cluster = require('cluster');

//domain middleware
module.exports = function(req, res, next) {
  var domain = require('domain').create();
  //assign the request id to the domain
  //so we can assert it is the same later
  //in tests
  domain.uuid = req.uuid;
  domain.add(req);
  domain.add(res);
  //bind the callback stack to this new domain
  domain.run(function() {
    next();
  });

  // Uncaught Exceptions will re-fork
  domain.once('error', function(e) {
    if (cluster.isWorker) {
      forky.disconnect();
    }

    return next(e);
  });
};
