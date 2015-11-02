var domain = require('domain');
var config = require('../../config');
var logger = require('../../lib/logger').create('Worker-Points');
var models = require('../../models');
var utils = require('../../utils');

// Calculate points earned

// Calculating points based on total amount spent
// - including tip
// - including tax
// - including delivery charge

// Mark order as points are given
var task = function() {
  var query = {
    limit: 2
  , where: {
      created_at: { $gte: config.rewardsStartDate }
    }
  };

  logger.info('Order.findReadyForAwardingPoints');
  models.Order.findReadyForAwardingPoints(query, function (error, orders) {
    if (error) return logger.create('DB').error("failed to get orders", {error: error}), utils.rollbar.reportMessage(error);
    if (orders.length == 0) return done();
    utils.async.each(orders, function(order, callback){
      models.User.addPointsForOrder(order.attributes.id, function(error){
        if (error) {
          var message = "failed to add points to user: " +
            order.attributes.user_id +
            " for order: " +
            order.attributes.id
          ;
          logger.create('DB').error(message, { error: error, order: order.toJSON() });
          utils.rollbar.reportMessage(error);
          return callback(error);
        };

        return callback();
      });
    }, done);
  });
}

var done = function (error) {
  if (!error) return process.exit(0);
  logger.error({ error: error });
  console.log(error);
  console.log(error.stack);
  utils.rollbar.reportMessage(error);
  return process.exit(1);
};

var worker = function () {
  var d = domain.create();
  d.on('error', done);
  d.run(task);
};

worker();