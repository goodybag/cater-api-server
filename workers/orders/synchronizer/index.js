/**
* Worker.Order.Synchronizer
*
* Performs data synchronizations on orders table
*
*/

var logger  = require('../../../lib/logger').create('Worker-Order-Synchronizer');
var utils = require('../../../utils');

var syncItemPrices = require('./item-price');

syncItemPrices(function (error) {
  if (error) {
    logger.error('Failed to sync items', {
      error: error
    });
    return process.exit(1);
  }

  logger.info('Order item sync complete!');
  return process.exit(0);
});
