var domain = require('domain');
var config = require('../../config');
var logger = require('../../logger').points;
var models = require('../../models');
var utils = require('../../utils');

// Calculate points earned

// Calculating points based on total amount spent
// - including tip
// - including tax
// - including delivery charge

// Mark order as points are given
var TAGS = ['worker-award-points'];

var task = function() {
  models.Order.findReadyForAwardingPoints(100, function (error, orders) {
    if (error) return logger.error(TAGS, "failed to get orders", error), utils.rollbar.reportMessage(error);
    orders.forEach(function(order){
      models.User.addPointsForOrder(order, function(error){
        if (error) {
          var message = "failed to add points to user: " +
            order.attributes.user_id +
            " for order: " +
            order.attributes.id
          ;
          logger.error(TAGS, message, error);
          utils.rollbar.reportMessage(error);
          return;
        };
      });
    })

  });
}

var done = function (error) {
  if (!error) return;
  console.log(error);
  console.log(error.stack);
  utils.rollbar.reportMessage(error);
};

var worker = function () {
  var d = domain.create();
  d.on('error', done);
  d.run(task);
};

worker();